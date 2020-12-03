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

const PICTURES_BASEPATH = process.env.HOSTING_S3ANDCLOUDFRONT_HOSTINGBUCKETNAME_CLOUDFRONTSECUREURL + '/';
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

    
    const album_galery_templateFile = 'website/albums-gallery-template.html';
    const albums_templateFile = 'website/albums-template.html';
    var coverPictureurl = "assets/img/img-1.jpg";

    //ALBUM LIST
    const paramsAlbumList = 
      {
        Bucket: BUCKET, // a path to your Bucket
        Key: album_galery_templateFile // a key (literally a path to your file)
      }
      const albumFileFromS3 = await S3.getObject(paramsAlbumList).promise();
      var album_gallery_templateHTML = albumFileFromS3.Body.toString('utf-8');
      
      //ALBUM GALERY
      const paramsAlbumGalery = 
      {
        Bucket: BUCKET, // a path to your Bucket
        Key: albums_templateFile // a key (literally a path to your file)
      }
      const albumsFileFromS3 = await S3.getObject(paramsAlbumGalery).promise();
      var albums_templateHTML = albumsFileFromS3.Body.toString('utf-8');

        const albumListResult = await client.query({           
            query: listAlbums,
            limit: 999            
        })

        let i=0;
        var albumHTML = "";
        var photoListHTML = "";
        
        
        while (albumListResult.data.listAlbums.items.length>i) {

          var labels = `<li> <h4 class="head">TAGS:</h4>\n`;
          var allLabels = new Array()

            photoListHTML = "";

            const photoByAlbumListResult = await client.query({           
                query: listPhotosByAlbum,
                variables: {albumId: albumListResult.data.listAlbums.items[i].id },
                limit: 999            
            });
            
            let j=0;
            
            while (photoByAlbumListResult.data.listPhotosByAlbum.items.length>j) {

              photoByAlbumListResult.data.listPhotosByAlbum.items[j].labels.forEach(element => {
                allLabels.push(element);
                
              } );



                photoListHTML += `
                      <div class="isotope-item">

                      <!-- Begin album single item -->
                      <div class="album-single-item">
                        <img class="asi-img" src="${PICTURES_BASEPATH}${photoByAlbumListResult.data.listPhotosByAlbum.items[j].thumbnail.key}" alt="image">
                        <!-- Begin item cover -->
                        <div class="asi-cover">
                          <a class="asi-link lg-trigger" href="${PICTURES_BASEPATH}${photoByAlbumListResult.data.listPhotosByAlbum.items[j].fullsize.key}"
                          data-exthumbnail="${PICTURES_BASEPATH}${photoByAlbumListResult.data.listPhotosByAlbum.items[j].thumbnail.key}"
                          ` +
                          (photoByAlbumListResult.data.listPhotosByAlbum.items[j].exifcamera ? ` data-sub-html="<p>${photoByAlbumListResult.data.listPhotosByAlbum.items[j].exifcamera}</p><p>${photoByAlbumListResult.data.listPhotosByAlbum.items[j].exiflens}</p>" ` : ``)
                          + ` >
                          </a>
                        </div>
                        <!-- End item cover -->
                      </div>
                      <!-- End album single item -->

                    </div>

                `;

                if(photoByAlbumListResult.data.listPhotosByAlbum.items[j].cover === true){
                  coverPictureurl=photoByAlbumListResult.data.listPhotosByAlbum.items[j].middlesize.key;
                }
                    

                j++
            }

          
          var keywords = "";
          var uniqueLabels = allLabels.filter(onlyUnique);
          if(uniqueLabels.length>20){
            uniqueLabels = uniqueLabels.slice(0, 20);
          }
          var m = 0;
          var comma = "";
          while (uniqueLabels.length>m) {

            comma = m!=uniqueLabels.length-1 ? "," : "";
            labels += `<span class="info"><a href="#">${uniqueLabels[m]}${comma}</a></span> \n`;
            keywords += `${uniqueLabels[m]} ${comma}`;
            m++;
          }

          labels += `</li> \n`;

   
            album_gallery_templateHTML_i = album_gallery_templateHTML.toString().replace(/\{PICTURES_LIST\}/g, photoListHTML);
            
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{PICTURES_NB\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items.length);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DESCRIPTION\}/g, albumListResult.data.listAlbums.items[i].description);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DATE\}/g, albumListResult.data.listAlbums.items[i].date);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_NAME\}/g, albumListResult.data.listAlbums.items[i].name);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_LABELS\}/g, labels);
            
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{KEYWORDS\}/g, keywords);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_COVER_IMAGE\}/g, PICTURES_BASEPATH + coverPictureurl);
            
            await Promise.all([
              S3.putObject({
                Body: album_gallery_templateHTML_i,
                Bucket: BUCKET,
                Key: "website/albums-gallery-" + (i+1) + ".html",
                ContentType: 'text/html',
    
              }).promise(), 
    
              
            ]);

            albumHTML += `


            <div class="isotope-item">

											<!-- Begin album list item -->
											<div class="album-list-item">
												<a class="ali-link" href="albums-gallery-${i+1}.html">
													<div class="ali-img-wrap">
														<img class="ali-img" src="${PICTURES_BASEPATH}${coverPictureurl}" alt="image">
													</div>
													<div class="ali-caption">
														<h2 class="ali-title">${albumListResult.data.listAlbums.items[i].name}</h2>
														<div class="ali-meta">${photoByAlbumListResult.data.listPhotosByAlbum.items.length} photos · ${albumListResult.data.listAlbums.items[i].date}</div>
													</div>
												</a>
												<a href="#0" class="album-share" title="Share this album" data-toggle="modal" data-target="#modal-76532457">
													<i class="fas fa-share-alt"></i>
												</a>

												

											</div>
											<!-- End album list item -->

                    </div>
                    
                `;
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
            Key: "website/albums.html",
            ContentType: 'text/html',

          }).promise(), 

          
        ]);

	}
	catch (err) {
		console.error(err);
		callback(err);
    }
    
    
};
