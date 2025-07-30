import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppSyncResolverHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface UpdateProfileImageInput {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface UpdateProfileImageResponse {
  uploadUrl: string;
  imageKey: string;
  user: {
    email: string;
    nickname: string;
    avatar?: string;
    description?: string;
  };
}

export const handler: AppSyncResolverHandler<UpdateProfileImageInput, UpdateProfileImageResponse> = async (event) => {
  console.log('Update profile image event:', JSON.stringify(event, null, 2));
  
  const { userId, fileName, fileType, fileSize } = event.arguments;
  
  if (!userId || !fileName || !fileType) {
    throw new Error('Missing required fields: userId, fileName, fileType');
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(fileType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
  }
  
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (fileSize > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB');
  }
  
  try {
    // 1. Get current user data
    const currentUser = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email: userId }
    }));
    
    if (!currentUser.Item) {
      throw new Error('User not found');
    }
    
    // 2. Generate unique image key
    const fileExtension = fileName.split('.').pop();
    const imageKey = `profile-pictures/${userId}/${randomUUID()}.${fileExtension}`;
    
    // 3. Delete old profile image if exists
    if (currentUser.Item.avatar) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: currentUser.Item.avatar
        }));
        console.log('Old profile image deleted:', currentUser.Item.avatar);
      } catch (deleteError) {
        console.warn('Failed to delete old profile image:', deleteError);
        // Continue with upload even if deletion fails
      }
    }
    
    // 4. Generate presigned URL for upload
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: imageKey,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    const uploadUrl = await getSignedUrl(s3Client as any, uploadCommand, {
      expiresIn: 300 // 5 minutes
    });
    
    // 5. Update user avatar in database
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email: userId },
      UpdateExpression: 'SET avatar = :avatar, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':avatar': imageKey,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    
    console.log('Profile image updated successfully:', imageKey);
    
    return {
      uploadUrl,
      imageKey,
      user: {
        email: updateResult.Attributes!.email,
        nickname: updateResult.Attributes!.nickname,
        avatar: updateResult.Attributes!.avatar,
        description: updateResult.Attributes!.description
      }
    };
    
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw new Error(`Failed to update profile image: ${(error as Error).message}`);
  }
};