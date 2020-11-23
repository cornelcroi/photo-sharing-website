export const listAlbumsWithPhotos = /* GraphQL */ `
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
        labels
        date
        createdAt
        updatedAt
        owner
        photos {
          items {
            id
            cover
            middlesize {
              key
            }
            bucket
          }
          nextToken
        }
      }
      nextToken
    }
  }
`;