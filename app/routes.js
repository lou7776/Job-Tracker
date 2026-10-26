module.exports = function(app, passport, db) {

  const objectId = require('mongodb').ObjectId
  const jobs = db.collection('jobs')
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
       
      const filter = {userId: req.user.id}

      const  status = req.query.status
      
      if (status === 'active' || status === 'done') filter.status = status; 

      const q =  (req.query.q || '').trim().toLowerCase();

    db.collection('jobs').find(filter).sort({urgent:-1, createdAt: -1}).toArray((err, result) => {
          if (err) return console.log(err)

          if (q) {
              result = result.filter( job => job.customer.toLowerCase().includes(q) || 
              job.title.toLowerCase().includes(q)
              )

            
          }


            res.render('profile.ejs', {
            user : req.user,
            jobs: result, 
            q,
            status: status || ''
          })
        })
    });



    app.get('/jobs/:id', isLoggedIn, (req, res) => {
      console.log('Job ID:', req.params.id)
      db.collection('jobs')
      .findOne({_id: new objectId(req.params.id), userId: req.user.id}, 
         {
        sort: {_id: -1}
       
      }, (err, result) => {
        if (err) return res.send(err)
        res.render( 'job.ejs', {user: req.user, result})
      })
    })

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/jobs', isLoggedIn, (req, res) => {
      console.log(req.body)
      const customer = String(req.body.customer || '').trim()
      const title = String(req.body.title || '').trim()
      
    if(!customer || !title) return res.status(400).send('customer and title are required')

    const items = String(req.body.items ||'').split('\n').map(line => line.trim()).filter(line => line.length > 0)
    .map(label => ({_id: new objectId(), label, done: false}))


      db.collection('jobs').save({
        userId: req.user.id, 
        customer,
        title,
        description: String(req.body.description || '').trim(), 
        quoteAmount: Number(req.body.quoteAmount) || 0, 
        items,
       
        status: 'active', 
        completedAt: null, 
        createdAt: new Date(), 
         urgent: req.body.urgent === 'on' }, (err, result) => {
        if (err) return res.status(500).send('job is not save')
        console.log('saved to database')
        res.redirect('/profile')
      })
    })




app.put('/jobs/:id/:items/:itemId', isLoggedIn, (req, res) => {
      db.collection('jobs')
      .updateOne({_id: new objectId(req.params.id), userId: req.user.id, status: 'active', 'items._id': new objectId(req.params.itemId) }, 
       
      
    {  $set: {
            'items.$.done': req.body.done === true
        
      } }, (err, result) => {
        if (err) return  res.status(500).json({error: 'problem with server'})

      if(result.matchedCount === 0){
          return res.status(409).json({error: 'job is done'})
      }
        res.json({ok: true})
      })
    })




    app.put('/jobs/:id/complete', isLoggedIn, (req, res) => {
      db.collection('jobs')
      .updateOne({_id: new objectId(req.params.id), userId: req.user.id, status: 'active', 'items.0': {$exists: true}, items:{$not: {$elemMatch: {done: false}}} 
      
      },
      {
        $set: {
            
          status : 'done',
            completedAt : new Date()
        }
      },  
       (err, result) => {
        if (err) return  res.status(500).json({error: 'problem with server'})

      if(result.matchedCount === 0){
          return res.status(409).json({error: 'finish all the tasks before marking job as done'})
      }
        res.json({ok: true})
      })
    })
      


    // app.put('/down', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp - 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    app.delete('/jobs/:id', isLoggedIn, (req, res) => {
      db.collection('jobs').findOneAndDelete({_id: new objectId(req.params.id), userId: req.user.id}, (err, result) => {
        if (err) return res.status(500).send(err) 
        res.send('job deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
