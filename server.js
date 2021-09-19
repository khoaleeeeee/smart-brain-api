const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');


const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'khoaleeeeee',
    password : '',
    database : 'smart-brain'
  }
});

app.get('/', (req, res) =>{
  res.send(database.users);
})

app.post('/signin', (req,res) => {
  const {email, password} = req.body;

  if (!email || !password){
    return res.status(400).json("Incorrect form entered")
  }

  db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if(isValid){
        return db.select('*').from('users')
        .where('email', '=', email)
        .then(user => {
          res.json(user[0])
        })
        .catch(err => res.status(400).json('Unable to get user'))
      }else{
        res.status(400).json('Wrong credentials');
      }
    })
    .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res)=>{
  const {email,name,password} = req.body;
  if (!email || !name || !password){
    return res.status(400).json("Incorrect form entered")
  }

  const hash = bcrypt.hashSync(password);

  db.transaction( trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          }).then(user => {
            res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json("Unable to join!"))
})

app.get('/profile/:id', (req, res) =>{
  const {id} = req.params;
  // let found = false;

  db.select('*').from('users')
  .where({id: id})
  .then(user => {
    res.json(user[0])
  })
  .catch(err => err.status(400).json("not found"))
})

app.put('/image', (req, res) =>{
  const {id} = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries);
  })
  .catch(err => res.status(400).json("Unable to get entries"))
})


app.listen(process.env.PORT || 3000, () =>{
  console.log(`app is running on port ${process.env.PORT}``);
})
