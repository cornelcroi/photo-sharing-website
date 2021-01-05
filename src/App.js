

import React, {useState, useEffect} from 'react';

import Amplify, {Auth} from 'aws-amplify'
import API, {graphqlOperation} from '@aws-amplify/api'
import Storage from '@aws-amplify/storage'
import aws_exports from './aws-exports'

import {AmplifyAuthenticator, AmplifySignIn, AmplifyGreetings} from "@aws-amplify/ui-react";


import {Divider,Container, Card, Image, Label, Modal,Button, Form, Grid, Header, Segment} from 'semantic-ui-react'

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import {v4 as uuid} from 'uuid';

import * as queries from './graphql/queries'
import * as queries_custom from './graphql/queries_custom'
import * as mutations from './graphql/mutations'
import * as subscriptions from './graphql/subscriptions'


Amplify.configure(aws_exports);

const NO_COVER_IMAGE = "img/no_cover.jpg"


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

function buildHTMLPageName(album_name, field){
  //build album page name
  var albumPageName = album_name.replace(/-/g, ' ');
  albumPageName = albumPageName.replace(/  +/g, ' ');
  albumPageName = albumPageName.replace(/[^\w\s]/gi, '')
  albumPageName = albumPageName.replace(/\s/g, '-');
  albumPageName = albumPageName.toLowerCase() + ".html";
  document.getElementById(field).innerHTML = albumPageName;

}


const NewAlbum = () => {
  
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false)
  
  const createAlbum = async(event) => {
    
    API.graphql(graphqlOperation(mutations.createAlbum, {input: {
      name,
      date,
      description
      
      }}))
    setName('')
    setDescription('');
    setDate('');
    
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
              <Form.Input name="name" value={name} onChange={(e) => {setName(e.target.value); buildHTMLPageName(e.target.value, 'create-html-name'); }} fluid label='Name' placeholder='Album name' />
              <Form.Input name="name" value={date} onChange={(e) => setDate(e.target.value)} fluid label='Date' placeholder='Album date' />
            </Form.Group>
            <b>Generated html page name</b> <div id="create-html-name"></div><br></br>

            
            <Form.TextArea name="description" value={description}  onChange={(e) => setDescription(e.target.value)} label='Description' placeholder='Album description' />
            
            <Form.Button type="submit"  color='green'  >Save</Form.Button>

        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

const PublishAlbum = () => {
  console.log("publish...");
  

  const [publishInProgress, setPublishInProgress] = useState(false)

  const publish = async(event) => {
    setPublishInProgress(true)
    console.log("publishing");
    
    await API.graphql(graphqlOperation(queries.generate))
    setPublishInProgress(false)
    
    }
  

  return (
    <Button color='green'
                    icon='upload'
                    labelPosition='left' 
                    onClick={publish}
                    disabled={publishInProgress}
                    content={publishInProgress ? 'Generating...' : 'Generate HTML'}
                    />
  )
}



const AlbumsList = () => {
  const [albums, setAlbums] = useState([])
  const [name, setName] = useState('')
  const [id, setId] = useState('')  
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false)
      
  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(graphqlOperation(queries_custom.listAlbumsWithPhotos, {limit: 999}))
      

      let j=0;
      while (result.data.listAlbums.items.length>j) {
        var found = result.data.listAlbums.items[j].photos.items.find(element => element.cover === true);
        if(found){
          result.data.listAlbums.items[j].cover = aws_exports.aws_content_delivery_url + "/" + found.middlesize.key;;

        }else{
          result.data.listAlbums.items[j].cover = NO_COVER_IMAGE;
        }
        j++

      }

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
          album.cover = NO_COVER_IMAGE;
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

  
  const deleteAlbum = async (albumid) => {

    let queryPicturesArgs = {
      albumId: albumid
    }

    const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryPicturesArgs))
    if(results.data.listPhotosByAlbum.items.length && results.data.listPhotosByAlbum.items.length> 0){      
      window.alert('You have pictures on this album. Please delete the pictures before deleting the album');
      
      
    }else{
      let queryAlbums = {
        id: albumid
      }
      await API.graphql({ query: mutations.deleteAlbum, variables: {input: queryAlbums}});
    }

  }

  
  const albumItems = () => {

    const openModify = async(id, name, date, desc) => {
      setOpen(true);
      setName(name)
      setDate(date)
      setDescription(desc)
      setId(id)
    }

    
    console.log(albums)
    return albums
      //.sort(makeComparator('name'))
      .map( album =>   {

         return <Card key={album.id}>
                  
                <Image src={album.cover} />
                <Card.Content>
                  <Card.Header>
                  <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
                  </Card.Header>
                  <Card.Meta>
                  {album.date} / {album.photos.items.length} photos
                  </Card.Meta>
                  <Card.Description>
                  {album.description}
                  </Card.Description>
                </Card.Content>
                
                <Card.Content extra>
                  <div className='ui three buttons'>
                    <Button basic color='red' onClick={()=>{
                        if (window.confirm('Are you sure you wish to delete this album ?'))  deleteAlbum(album.id);
                    }}>
                      Delete
                    </Button>
                    <Button basic color='green' onClick={() => openModify(album.id, album.name, album.date, album.description )}>
                      Modify
                    </Button>
                  </div>
                </Card.Content>

                
              </Card>
      
                }      
              
      );

    
  }
  
  const updateAlbum = async(event) => {
    
    var queryArgs = {
      id: id,
      name: name,
      date: date,
      description: description

    }

    API.graphql({ query: mutations.updateAlbum, variables: { input: queryArgs } });

    setName('');
    setDate('');
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
            <Form.Input name="name" value={name} onChange={(e) => { setName(e.target.value); buildHTMLPageName(e.target.value, 'mod-html-name'); }} fluid label='Name' placeholder='Album name' />
            <Form.Input name="date" value={date} onChange={(e) => setDate(e.target.value)} fluid label='Date' placeholder='Album date' />            
            </Form.Group>
            <b>Generated html page name</b> <div id="mod-html-name"></div><br></br>


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
      var objIndex = items.findIndex((obj => obj.id === i.id));
      items[objIndex] = i
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
      await API.graphql({ query: mutations.deletePhoto, variables: {input: queryArgs}});
  
    }

    const setCoverPicture = async (photoid) => {

    var queryArgs;

     photos.forEach(function(entry) {
      
       if (entry.cover && entry.cover === true) {
         queryArgs = {
          id: entry.id,
          cover: false    
        }

        API.graphql({ query: mutations.updatePhoto, variables: { input: queryArgs } });
 
       }

     });
     
      queryArgs = {
        id: photoid,
        cover: true

      }
      await API.graphql({ query: mutations.updatePhoto, variables: {input: queryArgs}});
  
    }

  
    const PhotosList = React.memo((props) => {

  
      const PhotoItems = (props) => {
        return (props.photos.map(photo => {

          const picUrl = aws_exports.aws_content_delivery_url + "/" + photo.thumbnail.key
          var picLabels="";
          if(photo.labels){
            picLabels=photo.labels.join(', ');
          }
            return ( 

            
              <Card  key={photo.id}>
              
              <Image src={picUrl} wrapped ui={false} />

    
              <Card.Content>
                <Card.Description>
                {photo.exifcamera} 
                </Card.Description>
                <Card.Meta>
                {photo.exiflens} 
                </Card.Meta>
                <Card.Description>
                {picLabels} 
                </Card.Description>
                <Card.Description>
                <div>
              {photo.cover && photo.cover===true ? 
                <div className="ui green label">Album cover</div> :  <Label as='a' image onClick={()=>{setCoverPicture(photo.id); }}>Set as album cover </Label>
              }
              
              </div>
                </Card.Description>
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
      const extention = file.name.split('.').pop();
      const fileName = 'upload/'+uuid()+"."+extention;
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
  console.log(process.env.PUBLIC_URL);
  return (
    
    <Router>

    <AmplifyAuthenticator usernameAlias="email">
    <AmplifySignIn slot="sign-in"  usernameAlias="email" hideSignUp/>
    
  

    <AmplifyGreetings slot="greetings" />

      <Grid padded>
        <Grid.Column>

        <Segment>
      
      
      
         <Container style={{padding: 10}}>

         <Route path={`${process.env.PUBLIC_URL}/`} exact component={PublishAlbum}/>

          <Route path={`${process.env.PUBLIC_URL}/`} exact component={NewAlbum}/>

           </Container>
           </Segment>

          
          <Route  path={`${process.env.PUBLIC_URL}/`}  exact component={AlbumsList}/>

          <Segment>
            <Route
              path={`${process.env.PUBLIC_URL}/albums/:albumId`}
              render={() => <div>
              <NavLink to='/'><Button color='blue'  content='Back to albums lists' icon='left arrow' labelPosition='left' /></NavLink>
            </div>}/>

          </Segment>
        

          <Route
            path={`${process.env.PUBLIC_URL}/albums/:albumId`}
            render={props => <AlbumDetails id={props.match.params.albumId}/>}/>
          
          

        </Grid.Column>
      </Grid>

      </AmplifyAuthenticator>

    </Router>
  )
}

export default App;



