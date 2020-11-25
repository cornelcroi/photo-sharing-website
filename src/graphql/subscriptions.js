/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateAlbum = /* GraphQL */ `
  subscription OnCreateAlbum($owner: String) {
    onCreateAlbum(owner: $owner) {
      id
      name
      description
      date
      createdAt
      updatedAt
      owner
      photos {
        items {
          id
          albumId
          bucket
          exifcamera
          exiflens
          labels
          cover
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
    }
  }
`;
export const onUpdateAlbum = /* GraphQL */ `
  subscription OnUpdateAlbum($owner: String) {
    onUpdateAlbum(owner: $owner) {
      id
      name
      description
      date
      createdAt
      updatedAt
      owner
      photos {
        items {
          id
          albumId
          bucket
          exifcamera
          exiflens
          labels
          cover
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
    }
  }
`;
export const onDeleteAlbum = /* GraphQL */ `
  subscription OnDeleteAlbum($owner: String) {
    onDeleteAlbum(owner: $owner) {
      id
      name
      description
      date
      createdAt
      updatedAt
      owner
      photos {
        items {
          id
          albumId
          bucket
          exifcamera
          exiflens
          labels
          cover
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
    }
  }
`;
export const onCreatePhoto = /* GraphQL */ `
  subscription OnCreatePhoto($owner: String) {
    onCreatePhoto(owner: $owner) {
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
        date
        createdAt
        updatedAt
        owner
        photos {
          nextToken
        }
      }
      owner
    }
  }
`;
export const onUpdatePhoto = /* GraphQL */ `
  subscription OnUpdatePhoto($owner: String) {
    onUpdatePhoto(owner: $owner) {
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
        date
        createdAt
        updatedAt
        owner
        photos {
          nextToken
        }
      }
      owner
    }
  }
`;
export const onDeletePhoto = /* GraphQL */ `
  subscription OnDeletePhoto($owner: String) {
    onDeletePhoto(owner: $owner) {
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
        date
        createdAt
        updatedAt
        owner
        photos {
          nextToken
        }
      }
      owner
    }
  }
`;
