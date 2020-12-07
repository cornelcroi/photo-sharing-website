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




## Repository structure 


```bash
.
├── README.md                                                         <-- This file    
├── amplify                                                           <-- Jupyter notebook which provides
│   └── backend                                                       <-- Jupyter notebook which provides  
│       ├── api                                                       <-- Jupyter notebook which provides
│       │   └── photosharing                                          <-- Jupyter notebook which provides
│       ├── auth                                                      <-- Jupyter notebook which provides
│       │   └── photosharing84970f75                                  <-- Jupyter notebook which provides
│       ├── backend-config.json                                       <-- Jupyter notebook which provides
│       ├── boostrap                                                  <-- Jupyter notebook which provides
│       │   └── adminuser                                             <-- Jupyter notebook which provides
│       ├── function                                                  <-- Jupyter notebook which provides
│       │   ├── S3Triggerac59657c                                     <-- Jupyter notebook which provides
│       │   └── StaticWeb59657c                                       <-- Jupyter notebook which provides  
│       ├── hosting                                                   <-- Jupyter notebook which provides
│       │   └── S3AndCloudFront                                       <-- Jupyter notebook which provides
│       ├── storage                                                   <-- Jupyter notebook which provides  
│       │   └── s3871f7e84                                            <-- Jupyter notebook which provides
│       └── tags.json                                                 <-- Jupyter notebook which provides
├── package-lock.json                                                 <-- Jupyter notebook which provides
├── package.json                                                      <-- Jupyter notebook which provides  
├── public                                                            <-- Jupyter notebook which provides  
│   ├── favicon.ico                                                   <-- Jupyter notebook which provides
│   ├── img                                                           <-- Jupyter notebook which provides
│   ├── index.html                                                    <-- Jupyter notebook which provides                             
│   └── website                                                       <-- Jupyter notebook which provides
│       ├── album-item-template.html                                  <-- Jupyter notebook which provides
│       ├── albums-assets                                             <-- Jupyter notebook which provides
│       ├── albums-gallery-1.html                                     <-- Jupyter notebook which provides
│       ├── albums-gallery-template.html                              <-- Jupyter notebook which provides
│       ├── albums-template.html                                      <-- Jupyter notebook which provides  
│       ├── albums.html                                               <-- Jupyter notebook which provides
│       ├── assets                                                    <-- Jupyter notebook which provides
│       ├── gallery-assets                                            <-- Jupyter notebook which provides
│       ├── images                                                    <-- Jupyter notebook which provides
│       ├── index.html                                                <-- Jupyter notebook which provides
│       └── photo-item-template.html                                  <-- Jupyter notebook which provides
├── scripts                                                           <-- Jupyter notebook which provides
├── src                                                               <-- Jupyter notebook which provides
    ├── App.css                                                       <-- Jupyter notebook which provides  
    ├── App.js                                                        <-- Jupyter notebook which provides
    ├── graphql                                                       <-- Jupyter notebook which provides
    ├── index.css                                                     <-- Jupyter notebook which provides  
    ├── index.js                                                      <-- Jupyter notebook which provides
    ├── logo.svg                                                      <-- Jupyter notebook which provides
    ├── reportWebVitals.js                                            <-- Jupyter notebook which provides
    └── setupTests.js                                                 <-- Jupyter notebook which provides
```

## Key points

- The application has 2 parts
    - **React app - Admin** with the following features:
        - Allows operations to be executed only by authenticated admin user
          - Create albums and add data about albums
          - Upload photos
            - Automatically creates 3 sizes
            - Automatically detects relevant labels for each uploaded photo using Amazon Rekognition
          - Generate the static website based on data stored in DynamoDB
          - A second CloudFront distribution is added that points to the hosting bucket to subfolder website where the static website mock sits
    - **Static html website**
        - is generated on demand by a AWS Lambda
        - website folder - mocked website
- CloudFront is used to serve the reactjs application and the static website
- To resize the pictures use Sharp library is used

- 2 CloudFront distributions pointing to the same S3 Bucket are used:
    - one to serve the reactjs application
    - the second one to serve the static website


## Credits

[Multiverse HTML template](https://html5up.net/multiverse)
[Lens HTML template](https://html5up.net/lens)
[Build a Photo-Sharing Web App with AWS Amplify Workshop](https://amplify-workshop.go-aws.com/)
[Create sharp layer for AWS Lambda](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process)

