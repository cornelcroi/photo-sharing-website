/* Amplify Params - DO NOT EDIT
  API_PHOTOSHARING_GRAPHQLAPIENDPOINTOUTPUT
  API_PHOTOSHARING_GRAPHQLAPIIDOUTPUT
  ENV
  HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME
  REGION
  STORAGE_S3871F7E84_BUCKETNAME
Amplify Params - DO NOT EDIT */

require('es6-promise').polyfill();
require('isomorphic-fetch');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const gql = require('graphql-tag');

let client = null


const listPhotosByAlbum = gql`
  query ListPhotosByAlbum(
    $albumId: ID
    $sortDirection: ModelSortDirection
    $filter: ModelPhotoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPhotosByAlbum(
      albumId: $albumId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        albumId
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
        exifcamera
        exiflens
        labels
        cover
        createdAt
        updatedAt
        album {
          id
          name
          description
          createdAt
          updatedAt
          owner
        }
        owner
      }
      nextToken
    }
  }
`;


const listAlbums = gql`
query ListAlbums(
  $filter: ModelAlbumFilterInput
  $limit: Int
  $nextToken: String
) {
  listAlbums(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      date
      description
      createdAt
      updatedAt
      owner
      photos {
        nextToken
      }
    }
    nextToken
  }
}
`;

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
const PICTURES_BASEPATH = process.env.IMAGES_BASE_PATH + '/';
const THEME = process.env.THEME;
exports.handler = async (event, context, callback) => {


  console.log('Received  event:', JSON.stringify(event, null, 2));

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


    const BUCKET = process.env.HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME;


    const album_galery_templateFile = THEME + '/albums-gallery-template.html';
    const albums_templateFile = THEME + '/albums-template.html';
    const album_item_template = THEME + '/album-item-template.html';
    const photo_item_template = THEME + '/photo-item-template.html';

    var coverPictureurl = "assets/img/img-1.jpg";


    //ALBUM LIST
    var params =
    {
      Bucket: BUCKET, 
      Key: album_galery_templateFile 
    }
    const albumListFromS3 = await S3.getObject(params).promise();
    var album_gallery_templateHTML = albumListFromS3.Body.toString('utf-8');

    //ALBUM GALERY
    params =
    {
      Bucket: BUCKET,
      Key: albums_templateFile 
    }
    const albumsGalleryFromS3 = await S3.getObject(params).promise();
    var albums_templateHTML = albumsGalleryFromS3.Body.toString('utf-8');


    //ALBUM_ITEM
    params =
    {
      Bucket: BUCKET, 
      Key: album_item_template 
    }
    const albumItemFromS3 = await S3.getObject(params).promise();
    var albumItem_templateHTML = albumItemFromS3.Body.toString('utf-8');


    //PHOTO_ITEM
    params =
    {
      Bucket: BUCKET, 
      Key: photo_item_template 
    }
    const photoItemFromS3 = await S3.getObject(params).promise();
    var photoItem_templateHTML = photoItemFromS3.Body.toString('utf-8');


    const albumListResult = await client.query({
      query: listAlbums,
      limit: 999
    })

    let i = 0;
    var albumHTML = "";
    var photoListHTML = "";
    var album_gallery_templateHTML_i = "";

    while (albumListResult.data.listAlbums.items.length > i) {

      var labels = ``;
      var allLabels = [];

      photoListHTML = "";

      const photoByAlbumListResult = await client.query({
        query: listPhotosByAlbum,
        variables: { albumId: albumListResult.data.listAlbums.items[i].id },
        limit: 999
      });

      let j = 0;

      while (photoByAlbumListResult.data.listPhotosByAlbum.items.length > j) {

        photoByAlbumListResult.data.listPhotosByAlbum.items[j].labels.forEach(element => allLabels.push(element));

        var current_photoItem_templateHTML = photoItem_templateHTML.toString().replace(/\{PHOTO_THUMBNAIL_URL\}/g, PICTURES_BASEPATH + photoByAlbumListResult.data.listPhotosByAlbum.items[j].thumbnail.key);
        current_photoItem_templateHTML = current_photoItem_templateHTML.toString().replace(/\{PHOTO_FULLSIZE_URL\}/g, PICTURES_BASEPATH + photoByAlbumListResult.data.listPhotosByAlbum.items[j].fullsize.key);
        current_photoItem_templateHTML = current_photoItem_templateHTML.toString().replace(/\{EXIF_CAMERA\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items[j].exifcamera);
        current_photoItem_templateHTML = current_photoItem_templateHTML.toString().replace(/\{EXIF_LENS\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items[j].exiflens);

        photoListHTML += current_photoItem_templateHTML;

        if (photoByAlbumListResult.data.listPhotosByAlbum.items[j].cover === true) {
          coverPictureurl = photoByAlbumListResult.data.listPhotosByAlbum.items[j].middlesize.key;
        }


        j++
      }


      var keywords = "";
      var uniqueLabels = allLabels.filter(onlyUnique);
      if (uniqueLabels.length > 20) {
        uniqueLabels = uniqueLabels.slice(0, 20);
      }
      var m = 0;
      var comma = "";
      while (uniqueLabels.length > m) {

        comma = m !== uniqueLabels.length - 1 ? ", " : "";
        labels += `<span class="info"><a href="#">${uniqueLabels[m]}${comma}</a></span> \n`;
        keywords += `${uniqueLabels[m]}${comma}`;
        m++;
      }

      //build album page name
      var albumPageName = albumListResult.data.listAlbums.items[i].name.replace(/-/g, ' ');
      albumPageName = albumPageName.replace(/  +/g, ' ');
      albumPageName = albumPageName.replace(/[^\w\s]/gi, '')
      albumPageName = albumPageName.replace(/\s/g, '-');
      albumPageName = albumPageName.toLowerCase() + ".html";
  


      album_gallery_templateHTML_i = album_gallery_templateHTML.toString().replace(/\{PICTURES_LIST\}/g, photoListHTML);

      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{PICTURES_NB\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items.length);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DESCRIPTION\}/g, albumListResult.data.listAlbums.items[i].description);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DATE\}/g, albumListResult.data.listAlbums.items[i].date);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_NAME\}/g, albumListResult.data.listAlbums.items[i].name);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_LABELS\}/g, labels);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{KEYWORDS\}/g, keywords);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_COVER_IMAGE\}/g, PICTURES_BASEPATH + coverPictureurl);
      album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{PAGE_NAME\}/g, albumPageName);

      await Promise.all([
        S3.putObject({
          Body: album_gallery_templateHTML_i,
          Bucket: BUCKET,
          Key: THEME + "/"+albumPageName,
          ContentType: 'text/html',

        }).promise(),


      ]);

      var albumItem_templateHTML_i = albumItem_templateHTML.toString().replace(/\{ALBUM_LINK\}/g, albumPageName);
      albumItem_templateHTML_i = albumItem_templateHTML_i.toString().replace(/\{ALBUM_COVER\}/g, PICTURES_BASEPATH + coverPictureurl);
      albumItem_templateHTML_i = albumItem_templateHTML_i.toString().replace(/\{ALBUM_NAME\}/g, albumListResult.data.listAlbums.items[i].name);
      albumItem_templateHTML_i = albumItem_templateHTML_i.toString().replace(/\{ALBUM_PHOTOS\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items.length);
      albumItem_templateHTML_i = albumItem_templateHTML_i.toString().replace(/\{ALBUM_DATE\}/g, albumListResult.data.listAlbums.items[i].date);

      albumHTML += albumItem_templateHTML_i;

      labels = "";

      i++;
    }

    albums_templateHTML = albums_templateHTML
      .toString()
      .replace(/\{ALBUMS_LIST\}/g, albumHTML);


    await Promise.all([
      S3.putObject({
        Body: albums_templateHTML,
        Bucket: BUCKET,
        Key: THEME + "/albums.html",
        ContentType: 'text/html',

      }).promise(),


    ]);

  }
  catch (err) {
    console.error(err);
    callback(err);
  }


};
