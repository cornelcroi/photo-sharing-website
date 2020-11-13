/* Amplify Params - DO NOT EDIT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIENDPOINTOUTPUT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
	STORAGE_S3871F7E84_BUCKETNAME
Amplify Params - DO NOT EDIT */

require('es6-promise').polyfill();
require('isomorphic-fetch');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const uuidv4 = require('uuid/v4');
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
        exifcamera
        exiflens
        featured
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


exports.handler = async (event, context, callback) => {
   
   
    console.log('Received  event:', JSON.stringify(event, null, 2));

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

   
    const BUCKET = process.env.STORAGE_S3871F7E84_BUCKETNAME + '-' + process.env.HOSTING_BUCKET_SUFFIX;

    const album_galery_templateFile = 'album-gallery-template.html';
    const albums_templateFile = 'albums-template.html';

    //ALBUM LIST
    const paramsAlbumList = 
      {
        Bucket: BUCKET, // a path to your Bucket
        Key: album_galery_templateFile // a key (literally a path to your file)
      }
      const albumFileFromS3 = await S3.getObject(paramsAlbumList).promise();
      // if successful then:
      //console.log(JSON.stringify(fileFromS3))
      var album_gallery_templateHTML = albumFileFromS3.Body.toString('utf-8');
      
      //ALBUM GALERY
      const paramsAlbumGalery = 
      {
        Bucket: BUCKET, // a path to your Bucket
        Key: albums_templateFile // a key (literally a path to your file)
      }
      const albumsFileFromS3 = await S3.getObject(paramsAlbumGalery).promise();
      var albums_templateHTML = albumsFileFromS3.Body.toString('utf-8');

    //s3client.download_file(BUCKET, templateFile, templateFile)


		//event.Records.forEach(processRecord);
        console.log('published start');
        const result = await client.query({           
            query: listAlbums,
            limit: 999            
        })

        let elementsMap = new Map();


        //console.log('result.data.listAlbums.items:',result.data.listAlbums.items);

        //result.data.listAlbums.items.forEach(element => console.log("ELEM"+element));

        let i=0;
        var albumHTML = "";
        var albumCSS = ""; 
        var photoListHTML = "";
        while (result.data.listAlbums.items.length>i) {
            
            console.log("result.data.listAlbums.items[i].name="+result.data.listAlbums.items[i].name);

            const result2 = await client.query({           
                query: listPhotosByAlbum,
                variables: {albumId: result.data.listAlbums.items[i].id },
                limit: 999            
            });
            
            let j=0;
            var photoArray = [];
            while (result2.data.listPhotosByAlbum.items.length>j) {

                
                photoArray.push({"thumbnail": result2.data.listPhotosByAlbum.items[j].thumbnail.key,
                "exifcamera": result2.data.listPhotosByAlbum.items[j].exifcamera,
                "exiflens": result2.data.listPhotosByAlbum.items[j].exiflens,
                "bucket": result2.data.listPhotosByAlbum.items[j].bucket
               });                
                //console.log("photoMap="+photoArray);
                photoListHTML += `
                    <div class="grid-item publications" data-src="images/demo/gallery/${result2.data.listPhotosByAlbum.items[j].thumbnail.key}">
                        <img src="images/demo/gallery/${result2.data.listPhotosByAlbum.items[j].thumbnail.key}" alt="">
                    </div>
                `;

                j++
            }

            albumHTML += `
            <div class="row row-no-gutter">
                <div class="col-md-6">
                    <div class="banner blog-2-image" id="blog-photo-post${i}"></div>
                </div>
                <div class="col-md-6">
                    <div class="blog-2-text">
                    <div class="vcenter blog-post-content">
                        <div class="blog-post-header">
                        <p class="blog-post-date">DATE  /  ${photoArray.length} photos</p>
                        </div>
                        <div class="voffset40"></div>
                        <h1 class="blog-post-title">${result.data.listAlbums.items[i].name}</h1>
                        <div class="voffset20"></div>
                        <p class="blog-post-intro">${result.data.listAlbums.items[i].description}</p>
                        <div class="voffset40"></div>
                        
                        <div class="voffset50"></div>
                        <a href="gallery-album1.html#page-gallery" class="readfull">See the full gallery</a>
                        <div class="voffset50"></div>
                    </div>
                    </div>
                </div>
            </div>`;
              
            albumCSS += `
            #blog-photo-post${i} {
                background-image: url('../images/theme/album-01.jpg');
              }`;

            elementsMap.set(result.data.listAlbums.items[i].name, 
                {"id": result.data.listAlbums.items[i].id,
                 "description": result.data.listAlbums.items[i].description,
                 "photos" : photoArray                 
                }
            );

            i++;
        }

        albums_templateHTML = albums_templateHTML
        .toString()
        .replace(/\{ALBUMS_LIST\}/g, albumHTML);
//        console.log("#### START ###");
//        console.log("#### SEND ###");
        console.log('published end');


        await Promise.all([
          S3.putObject({
            Body: albums_templateHTML,
            Bucket: BUCKET,
            Key: "albums.html",
            ContentType: 'text/html',

          }).promise(), 

          S3.putObject({
            Body: albumCSS,
            Bucket: BUCKET,
            Key: "styles/albums.css",
            ContentType: 'text/css',

          }).promise(), 

          
        ]);

	}
	catch (err) {
		console.error(err);
		callback(err);
    }
    
    
};
