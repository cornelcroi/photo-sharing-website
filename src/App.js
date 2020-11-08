

import React, {useState, useEffect} from 'react';

import Amplify, {Auth} from 'aws-amplify'
import API, {graphqlOperation} from '@aws-amplify/api'
import Storage from '@aws-amplify/storage'
import aws_exports from './aws-exports'

import {AmplifyAuthenticator, AmplifySignIn, AmplifySignUp} from "@aws-amplify/ui-react";


import {S3Image, withAuthenticator} from 'aws-amplify-react'

import {Divider,Container, Card, Label, Modal,Button, Form, Grid, Header, Segment} from 'semantic-ui-react'

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import {v4 as uuid} from 'uuid';

import * as queries from './graphql/queries'
import * as mutations from './graphql/mutations'
import * as subscriptions from './graphql/subscriptions'


Amplify.configure(aws_exports);




function makeComparator(key, order = 'asc') {
  return (a, b) => {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) 
      return 0;
    
    const aVal = (typeof a[key] === 'string')
      ? a[key].toUpperCase()
      : a[key];
    const bVal = (typeof b[key] === 'string')
      ? b[key].toUpperCase()
      : b[key];

    let comparison = 0;
    if (aVal > bVal) 
      comparison = 1;
    if (aVal < bVal) 
      comparison = -1;
    
    return order === 'desc'
      ? (comparison * -1)
      : comparison
  };
}


const NewAlbum = () => {
  const [name,
    setName] = useState('')

  const [description,
    setDescription] = useState('');
  
  const [open, setOpen] = React.useState(false)

  const createAlbum = async(event) => {
    
    API.graphql(graphqlOperation(mutations.createAlbum, {input: {
      name,
      description
      }}))
    setName('')
    setDescription('');
    
    setOpen(false);
  }

  return (
    <Modal 
      as={Form} 
      onSubmit={createAlbum}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Button color='yellow'
                    content='Create album'
                    icon='add'
                    labelPosition='left'/>}
                    
    >
      <Modal.Header>New album</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
      
            <Form.Group widths='equal'>
            <Form.Input name="name" value={name} onChange={(e) => setName(e.target.value)} fluid label='Name' placeholder='Album name' />
            </Form.Group>
            
            <Form.TextArea name="description" value={description}  onChange={(e) => setDescription(e.target.value)} label='Description' placeholder='Album description' />
            
            <Form.Button type="submit"  color='green'  >Save</Form.Button>

        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

const PublishAlbum = () => {
  console.log("publish...");
  
  const [name,
    setName] = useState('')

  const [description,
    setDescription] = useState('');
  
  const [open, setOpen] = React.useState(false)

  const publish = async(event) => {
    
    console.log("publishing");
    
    API.graphql(graphqlOperation(queries.echo, {input: {
      msg:"test"
      }}))
  //setName('')
  //  setDescription('');
    
  //  setOpen(false);

    
    }
  

  return (
    <Button color='green'
                    content='Publish'
                    icon='upload'
                    labelPosition='left' 
                    onClick={publish}
                    />
  )
}



const AlbumsList = () => {
  const [albums,
    setAlbums] = useState([])

    const [name,
      setName] = useState('')

    const [id,
        setId] = useState('')
  
    const [description,
      setDescription] = useState('');
  
    const [open, setOpen] = React.useState(false)

      
  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(graphqlOperation(queries.listAlbums, {limit: 999}))
      console.log('result.data.listAlbums.items:',result.data.listAlbums.items);
      setAlbums(result.data.listAlbums.items)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let subscription
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser()
      subscription = API.graphql(graphqlOperation(subscriptions.onCreateAlbum, {owner: user.username})).subscribe({
        next: (data) => {
          const album = data.value.data.onCreateAlbum
          setAlbums(a => a.concat([album].sort(makeComparator('name'))))
        }
      })
    }
    setupSubscription()

    return () => subscription.unsubscribe();
  }, [])


  const removeItem = (items, i) => {
    return items.filter(function(item) {
      return item.id !== i.id
    })
  }


  useEffect(() => {
    let subscription
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser()
      subscription = API.graphql(graphqlOperation(subscriptions.onDeleteAlbum, {owner: user.username})).subscribe({
        next: (data) => {
          const album = data.value.data.onDeleteAlbum
          setAlbums(a => removeItem(a, album))

        }
      })
    }
    setupSubscription()

    return () => subscription.unsubscribe();
  }, [])

  
  const getFeaturePic= async (albumid) => {
    
    let queryPicturesArgs = {
      albumId: albumid
    }

    const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryPicturesArgs))
    if(results.data.listPhotosByAlbum.items.length && results.data.listPhotosByAlbum.items.length> 0){      
      console.log('has pictures');


    }else{
      console.log('no picture, setting default feature pic');
    }

    return "&nbsp;"

  }
  
  const deleteAlbum = async (albumid) => {

    let queryPicturesArgs = {
      albumId: albumid
    }

    const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryPicturesArgs))
    console.log('results',results);
    if(results.data.listPhotosByAlbum.items.length && results.data.listPhotosByAlbum.items.length> 0){      
      window.alert('You have pictures on this album. Please delete the pictures before deleting the album');
      
      
    }else{
      let queryAlbums = {
        id: albumid
      }
      await API.graphql({ query: mutations.deleteAlbum, variables: {input: queryAlbums}});
    }
    console.log('results:',results);

  }

  
  const albumItems = () => {

    const openModify = async(id, name, desc) => {
      setOpen(true);
      setName(name)
      setDescription(desc)
      setId(id)
      console.log(id)
    }
    //getFeaturePic(album.id)

    return albums
      //.sort(makeComparator('name'))
      .map( album =>   
                <Card key={album.id}>
                  <Card.Content>
                  <Card.Header>
                  <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
                  </Card.Header>
                  <Card.Description>
                  {album.description}
                  </Card.Description>
                </Card.Content>
                
                <Card.Content extra>
                <div className='ui two buttons'>
                <Button basic color='red' onClick={()=>{
                      if (window.confirm('Are you sure you wish to delete this album ?'))  deleteAlbum(album.id);
                  }}>
                    Delete
                  </Button>
                  <Button basic color='green' onClick={() => openModify(album.id, album.name, album.description )}>
                    Modify
                  </Button>
                </div>
              </Card.Content>
              </Card>
              
      );

    
  }
  
  const updateAlbum = async(event) => {
    
    console.log(id)
    
    var queryArgs = {
      id: id,
      name: name,
      description: description

    }
    console.log(queryArgs)

    API.graphql({ query: mutations.updateAlbum, variables: { input: queryArgs } });


    setName('');
    setDescription('');
    setId('');

    setOpen(false);


  }

  return (
    <Segment>
      
       <div>
       
          <Container style={{padding: 10}}>
          

          <Header size='large'>Albums</Header>

          <div className="ui divider"></div>

          <Card.Group>
              {albumItems()} 
          </Card.Group>
          </Container>
          </div>
          <Modal 
      as={Form} 
      onSubmit={updateAlbum}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      
                    
    >
      <Modal.Header>Modify album</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
      
            <Form.Group widths='equal'>
            <Form.Input name="name" value={name} onChange={(e) => setName(e.target.value)} fluid label='Name' placeholder='Album name' />
            </Form.Group>
            
            <Form.TextArea name="description" value={description}  onChange={(e) => setDescription(e.target.value)} label='Description' placeholder='Album description' />
            
            <Form.Button type="submit"  color='green' >Save</Form.Button>

        </Modal.Description>
      </Modal.Content>
    </Modal>   
    </Segment>    
  );
}

  const AlbumDetails = (props) => {
    const [album, setAlbum] = useState({name: 'Loading...', photos: []})
    const [photos, setPhotos] = useState([])
    const [hasMorePhotos, setHasMorePhotos] = useState(true)
    const [fetchingPhotos, setFetchingPhotos] = useState(false)
    const [nextPhotosToken, setNextPhotosToken] = useState(null)
  
    useEffect(() => {
      const loadAlbumInfo = async() => {
        const results = await API.graphql(graphqlOperation(queries.getAlbum, {id: props.id}))
        setAlbum(results.data.getAlbum)
      }
  
      loadAlbumInfo()
    }, [props.id])
  
    useEffect(() => {
      fetchNextPhotos()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  
    useEffect(() => {
      let subscription
      async function setupSubscription() {
        const user = await Auth.currentAuthenticatedUser()
        subscription = API.graphql(graphqlOperation(subscriptions.onCreatePhoto, {owner: user.username})).subscribe({
          next: (data) => {
            const photo = data.value.data.onCreatePhoto
            if (photo && photo.albumId !== props.id) return
              setPhotos(p => p.concat([photo]))
          }
        })
      }
      setupSubscription()
  
      return () => subscription.unsubscribe();
    }, [props.id])

    const removeItem = (items, i) => {
      return items.filter(function(item) {
        return item.id !== i.id
      })
    }
    
    const updateItem = (items, i) => {
      console.log("Before update: ", items)
      var objIndex = items.findIndex((obj => obj.id === i.id));
      items[objIndex] = i
      console.log("After update: ", items)
      return items
    }


    
    const removePicsFromS3 = async (pic) => {
      var array = pic.split("/");
      var length = array.length
      var picToDelete = array[length-2]+"/" + array[length-1];

      //TODO to delete all pictures
      await Storage.vault.remove(picToDelete)
    }

    useEffect(() => {
      let subscription
      async function setupSubscription() {
        const user = await Auth.currentAuthenticatedUser()
        subscription = API.graphql(graphqlOperation(subscriptions.onDeletePhoto, {owner: user.username})).subscribe({
          next: (data) => {
            const photo = data.value.data.onDeletePhoto
            removePicsFromS3(photo.fullsize.key)
            removePicsFromS3(photo.thumbnail.key)
            if (photo && photo.albumId !== props.id) return
              setPhotos(p => removeItem(p, photo))
          }
        })
      }
      setupSubscription()
  
      return () => subscription.unsubscribe();
    }, [props.id])

    useEffect(() => {
      let subscription
      async function setupSubscription() {
        const user = await Auth.currentAuthenticatedUser()
        subscription = API.graphql(graphqlOperation(subscriptions.onUpdatePhoto, {owner: user.username})).subscribe({
          next: (data) => {
            
            const photo = data.value.data.onUpdatePhoto
            if (photo && photo.albumId !== props.id) return
              setPhotos(p => updateItem(p, photo))
          }
        })
      }
      setupSubscription()
  
      return () => subscription.unsubscribe();
    }, [props.id])


  
    const deletePic = async (photoid) => {
      let queryArgs = {
        id: photoid
      }
      const results = await API.graphql({ query: mutations.deletePhoto, variables: {input: queryArgs}});
  
    }

    const setFeaturePicture = async (photoid) => {

    var queryArgs;

    var toModify = false;
    
     photos.forEach(function(entry) {
      
       if (entry.featured && entry.featured === true) {
         console.log("true");
         console.log(entry.featured)
         queryArgs = {
          id: entry.id,
          featured: false
    
        }

        API.graphql({ query: mutations.updatePhoto, variables: { input: queryArgs } });

        toModify = true;
         
       }

     });
     
     queryArgs = {
      id: photoid,
      featured: false

    }

      queryArgs = {
        id: photoid,
        featured: true

      }
      await API.graphql({ query: mutations.updatePhoto, variables: {input: queryArgs}});
      //console.log('results:',results);
      console.log('photoid:',photoid);
  
    }

  
    const PhotosList = React.memo((props) => {

  
      const PhotoItems = (props) => {
        return (props.photos.map(photo => {

          console.log(photo.thumbnail.key);
          console.log('resized/' + photo.thumbnail.key.replace(/.+resized\//, ''));
          if(photo.featured && photo.featured===true){
            return (
              <Card color="green" title="Images">
              <S3Image 
                key={photo.thumbnail.key} 
                imgKey={photo.thumbnail.key}
                level="private"
                theme={{
                  photoImg: { maxWidth: "100%", maxHeight: "100%", borderRadius: "3px 3px 0px  0px" }
                }}
              />
    
              <Card.Content>
                <Card.Description>
                {photo.exifcamera} 
                </Card.Description>
                <Card.Meta>
                {photo.exiflens} 
                </Card.Meta>
                
              </Card.Content>
                         
              <Card.Content>
              <div><div className="ui green label">Album cover</div></div>

              <div>
            </div>
              </Card.Content>
              <Card.Content extra>
                    <div className='ui one buttons'>
                    <Button basic color='red' onClick={()=>{
                        if (window.confirm('Are you sure you wish to delete this picture ?'))  deletePic(photo.id);
                    }}>
                        Delete picture
                      </Button>
                    </div>
              </Card.Content>
              
              </Card>)
          }else{
            return (
              <Card color="yellow" title="Images">
              <S3Image 
                key={photo.thumbnail.key} 
                imgKey={'resized/' + photo.thumbnail.key.replace(/.+resized\//, '')}
                level="private"
                theme={{
                  photoImg: { maxWidth: "100%", maxHeight: "100%", borderRadius: "3px 3px 0px  0px" }
                }}
              />
    
              <Card.Content>
                <Card.Description>
                {photo.exifcamera} 
                </Card.Description>
                <Card.Meta>
                {photo.exiflens} 
                </Card.Meta>
                
              </Card.Content>
                         
              <Card.Content>
              <div>
              <Label as='a' image onClick={()=>{
                        setFeaturePicture(photo.id);
                    }}>
                Set as album cover
              </Label>
              
            </div>
              </Card.Content>
              <Card.Content extra>
                    <div className='ui one buttons'>
                    <Button basic color='red' onClick={()=>{
                        if (window.confirm('Are you sure you wish to delete this picture ?'))  deletePic(photo.id);
                    }}>
                        Delete picture
                      </Button>
                    </div>
              </Card.Content>
              
              </Card>)
          }
          

        }
  
        ));
      }
    
      return (
        <div>
          <Divider hidden />
          <Card.Group>
          <PhotoItems photos={props.photos} />
          </Card.Group>
        </div>
      );
    })

    const fetchNextPhotos = async () => {
      const FETCH_LIMIT = 20
      setFetchingPhotos(true)
      let queryArgs = {
        albumId: props.id,
        limit: FETCH_LIMIT, 
        nextToken: nextPhotosToken
      }
      if (! queryArgs.nextToken) delete queryArgs.nextToken
      const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryArgs))
      setPhotos(p => p.concat(results.data.listPhotosByAlbum.items))
      setNextPhotosToken(results.data.listPhotosByAlbum.nextToken)
      setHasMorePhotos(results.data.listPhotosByAlbum.items.length === FETCH_LIMIT)
      setFetchingPhotos(false)
    }
    return (
      <Segment>

        <Header size='large'>{album.name}</Header>
        <Header size='tiny'>{album.description}</Header>

        <S3ImageUpload albumId={album.id} />
        <div className="ui divider"></div>
        <PhotosList photos={photos} />
        {
            hasMorePhotos && 
            <Form.Button
              onClick={() => fetchNextPhotos()}
              icon='refresh'
              disabled={fetchingPhotos}
              content={fetchingPhotos ? 'Loading...' : 'Load more photos'}
            />
        }
        
      </Segment>
    )
  
  }   

  

  const S3ImageUpload = (props) => {
    const [uploading, setUploading] = useState(false)
    
    
    const uploadFile = async (file) => {
      const fileName = 'upload/'+uuid();
      const user = await Auth.currentAuthenticatedUser();
  
      const result = await Storage.vault.put(
        fileName, 
        file, 
        {
          metadata: {
            albumid: props.albumId,
            owner: user.username,
          }
        }
      );
  
      console.log('Uploaded file: ', result);
    }
  
    const onChange = async (e) => {
      setUploading(true)
      
      let files = [];
      for (var i=0; i<e.target.files.length; i++) {
        files.push(e.target.files.item(i));
      }
      await Promise.all(files.map(f => uploadFile(f)));
  
      setUploading(false)
    }
  
    return (
      <div>
        <Form.Button
          onClick={() => document.getElementById('add-image-file-input').click()}
          disabled={uploading}
          icon='file image outline'
          content={ uploading ? 'Uploading...' : 'Add Images' }
        />
        <input
          id='add-image-file-input'
          type="file"
          accept='image/*'
          multiple
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }




  
    
  
  

function App() {

  return (
    
    <Router>

    <AmplifyAuthenticator usernameAlias="email">
    <AmplifySignIn slot="sign-in" usernameAlias="email" hideSignUp/>
    <AmplifySignUp slot="sign-up" usernameAlias="email" />
    </AmplifyAuthenticator>



      <Grid padded>
        <Grid.Column>

        <Segment>
      
      
      
         <Container style={{padding: 10}}>

         <Route path="/" exact component={PublishAlbum}/>

          <Route path="/" exact component={NewAlbum}/>

           </Container>
           </Segment>

          
          <Route path="/" exact component={AlbumsList}/>

          <Segment>
            <Route
              path="/albums/:albumId"
              render={() => <div>
              <NavLink to='/'><Button color='blue'  content='Back to albums lists' icon='left arrow' labelPosition='left' /></NavLink>
            </div>}/>

          </Segment>
        

          <Route
            path="/albums/:albumId"
            render={props => <AlbumDetails id={props.match.params.albumId}/>}/>
          
          

        </Grid.Column>
      </Grid>
    </Router>
  )
}

export default App;
/*

export default  withAuthenticator(App, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
})*/


