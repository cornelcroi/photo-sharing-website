/* Amplify Params - DO NOT EDIT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIENDPOINTOUTPUT
	API_MANBEHINDLENSADMIN_GRAPHQLAPIIDOUTPUT
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
      labels
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

const PICTURES_BASEPATH = process.env.CLOUDFRONT_URL + '/';
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
            photoListHTML = "";

            const photoByAlbumListResult = await client.query({           
                query: listPhotosByAlbum,
                variables: {albumId: albumListResult.data.listAlbums.items[i].id },
                limit: 999            
            });
            
            let j=0;
            
            while (photoByAlbumListResult.data.listPhotosByAlbum.items.length>j) {

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

                if(photoByAlbumListResult.data.listPhotosByAlbum.items[j].cover === true)
                    coverPictureurl=photoByAlbumListResult.data.listPhotosByAlbum.items[j].middlesize.key;
                j++
            }

          var labels = "";
          var keywords = "";

          if(albumListResult.data.listAlbums.items[i].labels){

            var label_array = albumListResult.data.listAlbums.items[i].labels.split(" ");
            var jj= 0;
            labels += `<li> <h4 class="head">Labels:</h4>`;
            
            for (jj = 0; jj < label_array.length; jj++) {
              labels += `<span class="info">#${label_array[jj]}</span> `;
              keywords += `${label_array[jj]}, `;

            }

            labels += `</li>`;
          }
          
            album_gallery_templateHTML_i = album_gallery_templateHTML.toString().replace(/\{PICTURES_LIST\}/g, photoListHTML);
            
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{PICTURES_NB\}/g, photoByAlbumListResult.data.listPhotosByAlbum.items.length);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DESCRIPTION\}/g, albumListResult.data.listAlbums.items[i].description);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{DATE\}/g, albumListResult.data.listAlbums.items[i].date);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_NAME\}/g, albumListResult.data.listAlbums.items[i].name);
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{ALBUM_LABELS\}/g, labels);
            
            album_gallery_templateHTML_i = album_gallery_templateHTML_i.toString().replace(/\{KEYWORDS\}/g, keywords);
            
            await Promise.all([
              S3.putObject({
                Body: album_gallery_templateHTML_i,
                Bucket: BUCKET,
                Key: "website/albums-gallery-" + i + ".html",
                ContentType: 'text/html',
    
              }).promise(), 
    
              
            ]);

            albumHTML += `


            <div class="isotope-item">

											<!-- Begin album list item -->
											<div class="album-list-item">
												<a class="ali-link" href="albums-gallery-${i}.html">
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

												<!-- Begin album share modal -->
												<div id="modal-76532457" class="modal fade" tabindex="-1" role="dialog">
													<div class="modal-dialog modal-center">
														<div class="modal-content">
															<div class="modal-header">
																<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
																<h4 class="modal-title">Share to:</h4>
															</div>
															<div class="modal-body text-center">
																<!-- Begin modal share -->
																<div class="modal-share">
																	<ul>
																		<li><a href="#0" class="btn btn-social-min btn-facebook btn-rounded-full"><i class="fab fa-facebook-f"></i></a></li>
																		<li><a href="#0" class="btn btn-social-min btn-twitter btn-rounded-full"><i class="fab fa-twitter"></i></a></li>
																		<li><a href="#0" class="btn btn-social-min btn-google btn-rounded-full"><i class="fab fa-google-plus-g"></i></a></li>
																		<li><a href="#0" class="btn btn-social-min btn-pinterest btn-rounded-full"><i class="fab fa-pinterest-p"></i></a></li>
																		<li><a href="#0" class="btn btn-social-min btn-instagram btn-rounded-full"><i class="fab fa-instagram"></i></a></li>
																	</ul>
																	<input class="grab-link" type="text" readonly="" value="https://your-site.com/albums-gallery-${i}.html" onclick="this.select()">
																</div>
																<!-- End modal share -->
															</div>
														</div><!-- /.modal-content -->
													</div><!-- /.modal-dialog -->
												</div>
												<!-- End album share modal -->

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
