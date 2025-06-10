/**
 * Firebase Cloud Functions
 * Handles follower rewards, notifications, and account deletion
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * Follower Reward Function
 * Triggers when a user's follower count changes
 * Awards coins when reaching milestone thresholds
 */
exports.checkFollowerReward = functions.firestore
  .document('users/{userId}/followers/{followerId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    
    try {
      // Get user document
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log('User not found:', userId);
        return;
      }
      
      const userData = userDoc.data();
      const currentFollowers = userData.followersCount || 0;
      
      // Get reward threshold from settings
      const settingsDoc = await db.collection('settings').doc('rewardRule').get();
      const threshold = settingsDoc.exists ? settingsDoc.data().followerThreshold : 5000;
      
      // Check if user has reached the threshold for the first time
      if (currentFollowers >= threshold && !userData.rewardClaimed) {
        const rewardAmount = 1000; // ₹1000 reward
        
        // Update user's wallet
        await userRef.update({
          'wallet.balance': admin.firestore.FieldValue.increment(rewardAmount),
          rewardClaimed: true
        });
        
        // Add transaction record
        await db.collection('users').doc(userId).collection('transactions').add({
          type: 'reward',
          amount: rewardAmount,
          description: `Milestone reward for reaching ${threshold} followers`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send push notification
        if (userData.pushToken) {
          const message = {
            to: userData.pushToken,
            sound: 'default',
            title: 'Congratulations! 🎉',
            body: `You've earned ₹${rewardAmount} for reaching ${threshold} followers!`,
            data: { type: 'reward', amount: rewardAmount }
          };
          
          await sendPushNotification(message);
        }
        
        console.log(`Reward of ₹${rewardAmount} awarded to user ${userId}`);
      }
    } catch (error) {
      console.error('Error in checkFollowerReward:', error);
    }
  });

/**
 * New Message Notification
 * Sends push notification when a new message is received
 */
exports.sendMessageNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const messageData = snap.data();
    
    try {
      // Get chat document to find participants
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) return;
      
      const chatData = chatDoc.data();
      const recipientId = chatData.participants.find(id => id !== messageData.senderId);
      
      if (!recipientId) return;
      
      // Get recipient's push token
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      if (!recipientDoc.exists) return;
      
      const recipientData = recipientDoc.data();
      if (!recipientData.pushToken || !recipientData.settings?.notifications) return;
      
      // Send push notification
      const message = {
        to: recipientData.pushToken,
        sound: 'default',
        title: messageData.senderName || 'New Message',
        body: messageData.text.length > 50 
          ? messageData.text.substring(0, 50) + '...' 
          : messageData.text,
        data: { 
          type: 'message', 
          chatId: chatId,
          senderId: messageData.senderId 
        }
      };
      
      await sendPushNotification(message);
      
    } catch (error) {
      console.error('Error in sendMessageNotification:', error);
    }
  });

/**
 * Delete User Account
 * Removes all user data and associated files
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  
  try {
    const batch = db.batch();
    
    // Delete user document
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);
    
    // Delete user's posts
    const postsSnapshot = await db.collection('posts').where('userId', '==', userId).get();
    postsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's comments
    const commentsQuery = await db.collectionGroup('comments').where('userId', '==', userId).get();
    commentsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's chats (only if they are the only participant)
    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId).get();
    
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();
      if (chatData.participants.length === 1) {
        // Delete entire chat if user is the only participant
        batch.delete(chatDoc.ref);
      } else {
        // Remove user from participants
        batch.update(chatDoc.ref, {
          participants: admin.firestore.FieldValue.arrayRemove(userId)
        });
      }
    }
    
    // Delete following/followers subcollections
    const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
    followingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    const followersSnapshot = await db.collection('users').doc(userId).collection('followers').get();
    followersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete transactions
    const transactionsSnapshot = await db.collection('users').doc(userId).collection('transactions').get();
    transactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit all deletions
    await batch.commit();
    
    // Delete user's files from Storage
    const bucket = storage.bucket();
    await bucket.deleteFiles({
      prefix: `users/${userId}/`
    });
    
    // Delete user from Authentication
    await admin.auth().deleteUser(userId);
    
    console.log(`User account ${userId} successfully deleted`);
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user account');
  }
});

/**
 * Update Follower Counts
 * Maintains accurate follower/following counts
 */
exports.updateFollowerCounts = functions.firestore
  .document('users/{userId}/followers/{followerId}')
  .onWrite(async (change, context) => {
    const { userId, followerId } = context.params;
    
    try {
      const batch = db.batch();
      
      if (change.after.exists && !change.before.exists) {
        // New follower
        batch.update(db.collection('users').doc(userId), {
          followersCount: admin.firestore.FieldValue.increment(1)
        });
        batch.update(db.collection('users').doc(followerId), {
          followingCount: admin.firestore.FieldValue.increment(1)
        });
      } else if (!change.after.exists && change.before.exists) {
        // Unfollowed
        batch.update(db.collection('users').doc(userId), {
          followersCount: admin.firestore.FieldValue.increment(-1)
        });
        batch.update(db.collection('users').doc(followerId), {
          followingCount: admin.firestore.FieldValue.increment(-1)
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating follower counts:', error);
    }
  });

/**
 * Helper function to send push notifications
 */
async function sendPushNotification(message) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}