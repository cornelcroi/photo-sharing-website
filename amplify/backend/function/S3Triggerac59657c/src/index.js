/* Amplify Params - DO NOT EDIT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIENDPOINTOUTPUT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT *//* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiPhotoalbumsGraphQLAPIIdOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIIDOUTPUT
var apiPhotoalbumsGraphQLAPIEndpointOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIENDPOINTOUTPUT

Amplify Params - DO NOT EDIT */// eslint-disable-next-line

require('es6-promise').polyfill();
require('isomorphic-fetch');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const uuidv4 = require('uuid/v4');
const gql = require('graphql-tag');
var exifparser = require("exif-parser");


/*
Note: Sharp requires native extensions to be installed in a way that is compatible
with Amazon Linux (in order to run successfully in a Lambda execution environment).

If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
*/
const Sharp = require('sharp');

// We'll expect these environment variables to be defined when the Lambda function is deployed
const THUMBNAIL_WIDTH = 600;//parseInt(process.env.THUMBNAIL_WIDTH || 80, 10);
const THUMBNAIL_HEIGHT = 400;//parseInt(process.env.THUMBNAIL_HEIGHT || 80, 10);
let client = null


async function storePhotoInfo(item) {
  console.log('storePhotoItem', JSON.stringify(item))
  const createPhoto = gql`
    mutation CreatePhoto(
      $input: CreatePhotoInput!
      $condition: ModelPhotoConditionInput
    ) {
      createPhoto(input: $input, condition: $condition) {
        id
        albumId
        owner
        bucket
        fullsize {
          key
          width
          height
        }
        thumbnail {
          key
          width
          height
        }
        album {
          id
          name
          owner
        }
        exifcamera
        exiflens
        cover
      }
    }
  `;

  console.log('trying to createphoto with input', JSON.stringify(item))
	const result = await client.mutate({ 
      mutation: createPhoto,
      variables: { input: item },
      fetchPolicy: 'no-cache'
    })

  console.log('result', JSON.stringify(result))
  return result
  }

/*function thumbnailKey(keyPrefix, filename) {
	return `${keyPrefix}/resized/${filename}`;
}*/

function thumbnailKey(keyPrefix, filename) {
	return `public/resized/${filename}`;
}

function fullsizeKey(keyPrefix, filename) {
	return `public/fullsize/${filename}`;
}

function makeThumbnail(photo) {
	return Sharp(photo).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).toBuffer();
}

async function resize(photoBody, bucketName, key) {
  const keyPrefix = key.substr(0, key.indexOf('/upload/'))
  const originalPhotoName = key.substr(key.lastIndexOf('/') + 1)
  const originalPhotoDimensions = await Sharp(photoBody).metadata();
  console.log('keyPrefix='+keyPrefix);
  console.log('originalPhotoName='+originalPhotoName);
  const thumbnail = await makeThumbnail(photoBody);
  const DEST_BUCKET = bucketName + '-' + process.env.HOSTING_BUCKET_SUFFIX;

  //TODO add more sizes

  
	await Promise.all([
		S3.putObject({
			Body: thumbnail,
			Bucket: DEST_BUCKET,
			Key: thumbnailKey(keyPrefix, originalPhotoName),
		}).promise(),

		S3.copyObject({
			Bucket: DEST_BUCKET,
			CopySource: bucketName + '/' + key,
			Key: fullsizeKey(keyPrefix, originalPhotoName),
		}).promise(),
	]);

	await S3.deleteObject({
		Bucket: bucketName,
		Key: key
	}).promise();

	return {
		photoId: originalPhotoName,
		
		thumbnail: {
			key: thumbnailKey(keyPrefix, originalPhotoName),
			width: THUMBNAIL_WIDTH,
			height: THUMBNAIL_HEIGHT
		},

		fullsize: {
			key: fullsizeKey(keyPrefix, originalPhotoName),
			width: originalPhotoDimensions.width,
			height: originalPhotoDimensions.height
		}
	};
};

async function processRecord(record) {
	const bucketName = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
  const DEST_BUCKET = bucketName + '-' + process.env.HOSTING_BUCKET_SUFFIX;

  console.log('processRecord', JSON.stringify(record))

  if (record.eventName !== "ObjectCreated:Put" && record.eventName !== "ObjectCreated:CompleteMultipartUpload") { console.log('Is not a new file'); return; }
  if (! key.includes('upload/')) { console.log('Does not look like an upload from user'); return; }

  const originalPhoto = await S3.getObject({ Bucket: bucketName, Key: key }).promise()
  
	const metadata = originalPhoto.Metadata
  console.log('metadata', JSON.stringify(metadata))
  console.log('resize')
	const sizes = await resize(originalPhoto.Body, bucketName, key);    
  console.log('sizes', JSON.stringify(sizes))
  var metadataLens=""
  var metadataCamera="";
  var exifData = exifparser.create(originalPhoto.Body).parse();
  if (exifData.tags.ExposureTime
      && exifData.tags.FNumber
      && exifData.tags.ISO
      && exifData.tags.FocalLength
      && exifData.tags.LensModel) {

      var exposure = 1/parseFloat(exifData.tags.ExposureTime);

      metadataCamera = "1/"+ exposure +" sec at f / " + String(exifData.tags.FNumber) + ", ISO " + String(exifData.tags.ISO);
      metadataLens = String(exifData.tags.FocalLength) +" mm ("+ String(exifData.tags.LensModel) +")";

  }
	const id = uuidv4();
	const item = {
		id: id,
		owner: metadata.owner,
		albumId: metadata.albumid,
    bucket: DEST_BUCKET,
    thumbnail: {
      width: sizes.thumbnail.width,
      height: sizes.thumbnail.height, 
      key: sizes.thumbnail.key,
    },
    fullsize: {
      width: sizes.fullsize.width,
      height: sizes.fullsize.height,
      key: sizes.fullsize.key,
    },
    exifcamera: metadataCamera,
    exiflens: metadataLens,
    cover: "false"
  }

  console.log(JSON.stringify(metadata), JSON.stringify(sizes), JSON.stringify(item))
	await storePhotoInfo(item);
}


exports.handler = async (event, context, callback) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  client = new AWSAppSyncClient({
    url: process.env.API_MANBEHINDLENSADMIN_GRAPHQLAPIENDPOINTOUTPUT,
    region: process.env.REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: AWS.config.credentials
    },
    disableOffline: true
  });
 
	try {
		event.Records.forEach(processRecord);
		callback(null, { status: 'Photo Processed' });
	}
	catch (err) {
		console.error(err);
		callback(err);
	}
};

