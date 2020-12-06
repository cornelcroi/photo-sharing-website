/* Amplify Params - DO NOT EDIT
  API_PHOTOSHARING_GRAPHQLAPIENDPOINTOUTPUT
  API_PHOTOSHARING_GRAPHQLAPIIDOUTPUT
  ENV
  HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME
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
const Rekognition = new AWS.Rekognition();


/*
Note: Sharp requires native extensions to be installed in a way that is compatible
with Amazon Linux (in order to run successfully in a Lambda execution environment).

If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
*/
const Sharp = require('sharp');

// We'll expect these environment variables to be defined when the Lambda function is deployed
const THUMBNAIL_WIDTH = 600;
const THUMBNAIL_HEIGHT = 400;

const MIDDLESIZE_WIDTH = 961;
const MIDDLESIZE_HEIGHT = 591;

let client = null

async function getLabelNames(bucketName, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: key
      }
    },
    MaxLabels: 5,
    MinConfidence: 80
  };
  const detectionResult = await Rekognition.detectLabels(params).promise();
  const labelNames = detectionResult.Labels.map((l) => l.Name.toLowerCase());
  return labelNames;
}


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
        middlesize {
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
        labels
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

function thumbnailKey(filename) {
  return `public/resized/${filename}`;
}

function middlesizeKey(filename) {
  return `public/middlesize/${filename}`;
}

function fullsizeKey(filename) {
  return `public/fullsize/${filename}`;
}

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function resizePicture(photo, width, height) {

  return Sharp(photo).resize(width, height).toBuffer();
}

async function resize(photoBody, bucketName, key) {

  const thumbnailWidth = THUMBNAIL_WIDTH;
  const thumbnailHeight = THUMBNAIL_HEIGHT + getRandomArbitrary(50, 400);

  const middlesizeWidth = MIDDLESIZE_WIDTH;
  const middlesizeHeight = MIDDLESIZE_HEIGHT + getRandomArbitrary(50, 1000);

  const originalPhotoName = key.substr(key.lastIndexOf('/') + 1)
  const originalPhotoDimensions = await Sharp(photoBody).metadata();
  const thumbnail = await resizePicture(photoBody, thumbnailWidth, thumbnailHeight);
  const middlesize = await resizePicture(photoBody, middlesizeWidth, middlesizeHeight);

  const DEST_BUCKET = process.env.HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME;

  await Promise.all([
    S3.putObject({
      Body: thumbnail,
      Bucket: DEST_BUCKET,
      Key: thumbnailKey(originalPhotoName),
    }).promise(),

    S3.putObject({
      Body: middlesize,
      Bucket: DEST_BUCKET,
      Key: middlesizeKey(originalPhotoName),
    }).promise(),

    S3.copyObject({
      Bucket: DEST_BUCKET,
      CopySource: bucketName + '/' + key,
      Key: fullsizeKey(originalPhotoName),
    }).promise(),
  ]);

  await S3.deleteObject({
    Bucket: bucketName,
    Key: key
  }).promise();

  return {
    photoId: originalPhotoName,

    thumbnail: {
      key: thumbnailKey(originalPhotoName),
      width: thumbnailWidth,
      height: thumbnailHeight
    },
    middlesize: {
      key: middlesizeKey(originalPhotoName),
      width: MIDDLESIZE_WIDTH,
      height: MIDDLESIZE_HEIGHT
    },
    fullsize: {
      key: fullsizeKey(originalPhotoName),
      width: originalPhotoDimensions.width,
      height: originalPhotoDimensions.height
    }
  };
};

async function processRecord(record) {
  const bucketName = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
  const DEST_BUCKET = process.env.HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME;

  if (record.eventName !== "ObjectCreated:Put" && record.eventName !== "ObjectCreated:CompleteMultipartUpload") { console.log('Is not a new file'); return; }
  if (!key.includes('upload/')) { console.log('Does not look like an upload from user'); return; }

  const originalPhoto = await S3.getObject({ Bucket: bucketName, Key: key }).promise()

  const labelNames = await getLabelNames(bucketName, key);
  console.log(labelNames, labelNames)


  const metadata = originalPhoto.Metadata
  const sizes = await resize(originalPhoto.Body, bucketName, key);
  var metadataLens = ""
  var metadataCamera = "";
  var exifData = exifparser.create(originalPhoto.Body).parse();
  if (exifData.tags.ExposureTime
    && exifData.tags.FNumber
    && exifData.tags.ISO
    && exifData.tags.FocalLength
    && exifData.tags.LensModel) {

    var exposure = 1 / parseFloat(exifData.tags.ExposureTime);

    metadataCamera = "1/" + exposure + " sec at f / " + String(exifData.tags.FNumber) + ", ISO " + String(exifData.tags.ISO);
    metadataLens = String(exifData.tags.FocalLength) + " mm (" + String(exifData.tags.LensModel) + ")";

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
    middlesize: {
      width: sizes.middlesize.width,
      height: sizes.middlesize.height,
      key: sizes.middlesize.key,
    },
    fullsize: {
      width: sizes.fullsize.width,
      height: sizes.fullsize.height,
      key: sizes.fullsize.key,
    },
    exifcamera: metadataCamera,
    exiflens: metadataLens,
    labels: labelNames,
    cover: "false"
  }

  console.log(JSON.stringify(metadata), JSON.stringify(sizes), JSON.stringify(item))
  await storePhotoInfo(item);
}


exports.handler = async (event, context, callback) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  client = new AWSAppSyncClient({
    url: process.env.API_PHOTOSHARING_GRAPHQLAPIENDPOINTOUTPUT,
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

