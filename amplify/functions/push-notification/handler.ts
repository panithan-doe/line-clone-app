import { DynamoDBStreamEvent, DynamoDBRecord, Context } from 'aws-lambda';

interface Message {
  id: string;
  content: string;
  chatRoomId: string;
  senderId: string;
  senderNickname: string;
  createdAt: string;
}

export const handler = async (event: DynamoDBStreamEvent, _context: Context) => {
  console.log('Push notification Lambda triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
      try {
        await processNewMessage(record);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  }

  return { statusCode: 200, body: 'Push notifications processed' };
};

async function processNewMessage(record: DynamoDBRecord) {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) return;

  // Parse the message from DynamoDB stream
  const message: Message = {
    id: newImage.id?.S || '',
    content: newImage.content?.S || '',
    chatRoomId: newImage.chatRoomId?.S || '',
    senderId: newImage.senderId?.S || '',
    senderNickname: newImage.senderNickname?.S || '',
    createdAt: newImage.createdAt?.S || '',
  };

  console.log('Processing new message:', message);

  // For now, we'll log the notification
  // In a real implementation, you would:
  // 1. Get chat room members
  // 2. Get their device tokens/endpoints
  // 3. Send push notifications via SNS

  const notificationMessage = {
    title: `New message from ${message.senderNickname}`,
    body: message.content.length > 50 
      ? `${message.content.substring(0, 50)}...` 
      : message.content,
    data: {
      chatRoomId: message.chatRoomId,
      messageId: message.id,
      senderId: message.senderId,
    }
  };

  console.log('Would send push notification:', notificationMessage);

  // TODO: Implement actual push notification sending
  // This would involve:
  // 1. Query ChatRoomMember table to get all members of the chat room
  // 2. Filter out the sender (don't notify themselves)
  // 3. Get device tokens for each member
  // 4. Send push notifications via SNS/FCM/APNS

  return notificationMessage;
}