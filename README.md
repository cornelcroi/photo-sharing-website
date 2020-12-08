# ManBehindLens.com

Static pre redered photosharing site

## Goal

Static photosharing site to share your pictures without needing to run or maintain servers.

TODO - create video demo like https://github.com/jpsim/AWSPics

## The architecture

![](public/website/assets/img/manbehindlens.png)



## Prerequisites
- [Create an AWS account](https://aws.amazon.com/fr/premiumsupport/knowledge-center/create-and-activate-aws-account/)
- [Install the Amplify CLI](https://docs.amplify.aws/cli/start/install#install-the-amplify-cli)
- [Configure Amplify](https://docs.amplify.aws/cli/start/install#configure-the-amplify-cli)
- [Install npm](https://www.npmjs.com/get-npm)

## Concept

1. Create ReactJs web application to allow authenticated users to create albums, upload photos and store everything in DynamoDB
2. Put a static website with html template files in a subfolder of reactjs application
and copy it to a subfolder inside /public folder
3. Create AWS Lambda to generate static files using html templates and using  based on data stored in DynamoDB

## Instructions

**1. Clone the repository**

  ```
  git clone REPO_URL
  ```
**2. Installs the dependencies**
  ```
  npm install
  ```
**3. Customize the application**

- Create a sharp layer for Lambda

  - The application resizes images using the Sharp npm library
  - Follow [this tutorial](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process) to create a sharp layer.
  - Run this command to list available layers
    ```bash 
    aws lambda list-layers
    ``` 

  You should have a result like this 
    ```
    {
        "Layers": [
            {
                "LayerName": "Sharp",
                "LayerArn": "arn:aws:lambda:AWS_REGION:ACCOUNT_ID:layer:Sharp",
                "LatestMatchingVersion": {
                    "LayerVersionArn": "arn:aws:lambda:AWS_REGION:ACCOUNT_ID:layer:Sharp:1",
                    "Version": 5,
                    "Description": "Sharp NPM package.",
                    "CreatedDate": "2020-12-06T12:27:23.068+0000",
                    "CompatibleRuntimes": [
                        "nodejs12.x"
                    ],
                    "LicenseInfo": "Available under the Apache-2.0 license."
                }
            }
        ]
    }
    ```

  - Update the layer name and version using the values from `LayerVersionArn` 

  - Open the file `amplify/backend/function/S3Triggerac59657c/S3Triggerac59657c-cloudformation-template.json` and put the name and the version number from your AWS account instead of the values found `SHARP_LAYER_NAME` and `SHARP_VERSION`.
      ```
      "Layers": [
                {
                  "Fn::Sub": [
                    "arn:aws:lambda:${region}:${account}:layer:SHARP_LAYER_NAME:SHARP_VERSION",
                    {
                      "region": {
                        "Ref": "AWS::Region"
                      },
                      "account": {
                        "Ref": "AWS::AccountId"
                      }
                    }
                  ]
                }
              ]
      ```
  - Use your email address for admin user

  - Deploy the stack to your AWS account

    - Initialize your Amplify powered cloud application
      ```
      amplify init
      ```
    - Provisions cloud resources with the local developments run
      ```
      amplify push
      ```
    - Publish static assets to Amazon S3
      ```
      amplify publish
      ```
Enjoy !



## Key points

  - full-stack ReactJs Application developped using AWS Amplify
  - single admin user created at deployment 
  - automatically creates photo thumbnails
  - automatically detects relevant labels for each uploaded photo and display these labels on album gallery page
  - static website is generated on demand by a AWS Lambda
  - static website sits in `./public/website` folder
  - 4 html templates
  ```
    /albums-gallery-template.html                                       <-- template for an album gallery page
    /albums-template.html                                               <-- template for list of albums page
    /album-item-template.html                                           <-- template for one album used in list of albums page
    /photo-item-template.html                                           <-- template for one photo used on album gallery page
  ```
  - each html template contains variable to be replaced by lambda
  ```html
    <div>
      <h2>{ALBUM_NAME}</h2>
      <div>{ALBUM_PHOTOS} photos · {ALBUM_DATE}</div>
    </div>
  ```
  - amplify selected hosting option is S3 with CloudFront using HTTPS
    - the created CloudDistribution points to the root folder of hosting S3 bucket
    - add a second CloudFront distribution to point to `/website` subfolder in the hosting S3 Bucket (where the static website sits)

 ## Tools

- The  [AWS Amplify JavaScript library](https://docs.amplify.aws/), to connect our front end to cloud resources
- [Amazon Cognito](https://aws.amazon.com/cognito/), to handle admin sign up authorization
- [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/), to store and serve as many photos as I wish to upload,, to **host the reactjs app** assets for our app and to host the **static generated website**
- [Amazon CloudFront](https://aws.amazon.com/fr/cloudfront/), to store and serve as many photos as our users care to upload, and to host the static assets for our app

- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/), to provide millisecond response times to API queries for album and photo data
- [AWS AppSync](https://aws.amazon.com/appsync/), to host a GraphQL API for our front end
- [AWS Lambda](https://aws.amazon.com/lambda/), to **create photo thumbnails** asynchronously in the cloud & to **generate the static website** on demand
- [Amazon Rekognition](https://aws.amazon.com/rekognition/), to detect 5 labels for each uploaded photo
   

## When to use pre rendered static website ?

- pre-rendered static HTML of static sites loads much faster than the pages on a dynamic site. Fast websites are really important for a good user experience, and also for boosting your site in search engine rankings.
- Since there are no dynamic scripts running on a static site, and every page is pre-rendered, your site is less likely to go down when there’s a traffic spike.
- Static site generators reduce site complexity. That, in turn, improves speed and reliability, and smooths the developer experience.
- You don’t have to worry about database-toppling traffic spikes.
- you can host your site with a content delivery network that scales with your site’s traffic.


## Costs
Less than a cup of coffee per month



## Credits

- [Multiverse HTML template](https://html5up.net/multiverse)
- [Lens HTML template](https://html5up.net/lens)
- [Build a Photo-Sharing Web App with AWS Amplify Workshop](https://amplify-workshop.go-aws.com/)
- [Create sharp layer for AWS Lambda](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process)

