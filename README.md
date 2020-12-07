# ManBehindLens.com

Public photo gallery.

## Goal

Build a self-contained, declarative infrastructure, static photo gallery to share pictures without needing to run, maintain (or pay for) servers.


TODO - create video demo like https://github.com/jpsim/AWSPics



## The architecture

![](public/website/assets/img/manbehindlens.png)

## Tools

- The  [AWS Amplify JavaScript library](https://docs.amplify.aws/), to connect our front end to cloud resources
- [Amazon Cognito](https://aws.amazon.com/cognito/), to handle admin sign up authorization
- [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/), to store and serve as many photos as I wish to upload,, to **host the reactjs app** assets for our app and to host the **static generated website**
- [Amazon CloudFront](https://aws.amazon.com/fr/cloudfront/), to store and serve as many photos as our users care to upload, and to host the static assets for our app

- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/), to provide millisecond response times to API queries for album and photo data
- [AWS AppSync](https://aws.amazon.com/appsync/), to host a GraphQL API for our front end
- [AWS Lambda](https://aws.amazon.com/lambda/), to **create photo thumbnails** asynchronously in the cloud & to **generate the static website** on demand
- [Amazon Rekognition](https://aws.amazon.com/rekognition/), to detect 5 labels for each uploaded photo


## Prerequisites

- [Install the Amplify CLI](https://docs.amplify.aws/cli/start/install#install-the-amplify-cli)
- [Configure Amplify](https://docs.amplify.aws/cli/start/install#configure-the-amplify-cli)
- [Install npm](https://www.npmjs.com/get-npm)


## Instructions

**Clone the repository**

```
git clone REPO_URL
```
**Installs the dependencies**
```
npm install
```

**Create [sharp layer](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process) for Lambda**

After the deployment completes, the new Lambda layer is available to use. Run this command to see the available layers:

**Update the layer name and version**

Run `aws lambda list-layers` and look the value of `LayerArn` 

Open the file `amplify/backend/function/S3Triggerac59657c/S3Triggerac59657c-cloudformation-template.json` and put the name and the version number from your AWS account instead of the values found `SHARP_LAYER_NAME` and `SHARP_VERSION`.
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
**Run Amplify commands**

The following command is a one-time initialization step for your Amplify powered cloud app. You run this once 'to connect your app with an AWS backend. This setup helps you with selecting your AWS Profile which would be used to provision cloud resources for your app.
This command will initialize the AWS configuration and create a configuration file at the root of the application.

```
amplify init
```

To provisions cloud resources with the local developments run
```
amplify push
```

Runs amplify push, publishes a static assets to Amazon S3.
Build all your local back-end and front-end resources (if you have a hosting category added) and provision it in the cloud.
```
amplify publish
```

Create an admin user
```
aws cognito-idp sign-up \
  --region YOUR_COGNITO_REGION \
  --client-id YOUR_COGNITO_APP_CLIENT_ID \
  --username admin@example.com \
  --password Passw0rd!
```

```
aws cognito-idp admin-confirm-sign-up \
  --region YOUR_COGNITO_REGION \
  --user-pool-id YOUR_COGNITO_USER_POOL_ID \
  --username admin@example.com
```



- 2 CloudFront distributions pointing to the same S3 Bucket are used:
    - one to serve the reactjs application
    - the second one to serve the static website


## Repository structure 
## Key points

```bash
.
├── README.md                                               
├── amplify
│   └── backend
│       ├── api
│       │   └── photosharing
│       │       ├── parameters.json
│       │       ├── schema.graphql
│       │       ├── stacks
│       │       │   └── CustomResources.json
│       │       └── transform.conf.json
│       ├── auth
│       │   └── photosharing84970f75
│       │       ├── manbehindlensadmin84970f75-cloudformation-template.yml
│       │       └── parameters.json
│       ├── backend-config.json
│       ├── boostrap
│       │   └── adminuser
│       │       ├── parameters.json
│       │       └── template.yml
│       ├── function
│       │   ├── S3Triggerac59657c
│       │   │   ├── S3Triggerac59657c-cloudformation-template.json
│       │   │   ├── S3Triggerac59657c-cloudformation-template.json-e
│       │   │   ├── amplify.state
│       │   │   ├── function-parameters.json
│       │   │   ├── parameters.json
│       │   │   └── src
│       │   │       ├── event.json
│       │   │       ├── index.js
│       │   │       ├── package-lock.json
│       │   │       └── package.json
│       │   └── StaticWeb59657c
│       │       ├── StaticWeb59657c-cloudformation-template.json
│       │       ├── amplify.state
│       │       ├── function-parameters.json
│       │       ├── parameters.json
│       │       └── src
│       │           ├── event.json
│       │           ├── index.js
│       │           ├── package-lock.json
│       │           └── package.json
│       ├── hosting
│       │   └── S3AndCloudFront
│       │       ├── parameters.json
│       │       └── template.json
│       ├── storage
│       │   └── s3871f7e84
│       │       ├── parameters.json
│       │       ├── s3-cloudformation-template.json
│       │       ├── s3-cloudformation-template.json-e
│       │       └── storage-params.json
│       └── tags.json
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── img
│   │   └── no_cover.jpg
│   ├── index.html
│   ├── robots.txt
│   └── website
│       ├── album-item-template.html
│       ├── albums-assets
│       ├── albums-gallery-1.html
│       ├── albums-gallery-template.html
│       ├── albums-template.html
│       ├── albums.html
│       ├── assets
│       ├── gallery-assets
│       ├── images
│       ├── index.html
│       └── photo-item-template.html
├── scripts
├── src
    ├── App.css
    ├── App.js
    ├── graphql
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js
```


- The application has 2 modules
    - **Admin** with the following features:
        - Allow the admin user sign in
        - Store data about albums, photos
        - Upload photos
        - Automatically creates photo different thumbnails to be used on the static website
        - Automatically detects relevant labels for each uploaded photo
        - Generates the static website based on all metadata stored inside DynamoDB
    - **Static website**
        - Is being generated on demand by a AWS Lambda
- CloudFront is used to serve the reactjs application and the static website
- Direct access to the S3 Web Bucket is blocked. All traffic must passe through CloudFront
- To resize the pictures use Sharp library is used



## Resources

- [Create sharp layer for AWS Lambda](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process)
- [Build a Photo-Sharing Web App with AWS Amplify Workshop](https://amplify-workshop.go-aws.com/)

