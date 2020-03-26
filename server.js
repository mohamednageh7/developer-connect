const express = require('express');
const connectDB = require('./config/db');
const app = express();
const path = require('path');

//connect database
connectDB();

// Init Middelware
app.use(express.json({ extended: false }));

const port = process.env.PORT || 5000;

// Define route
app.use('/api/users', require('./router/api/user'));

app.use('/api/posts', require('./router/api/post'));

app.use('/api/profile', require('./router/api/profile'));

app.use('/api/auth', require('./router/api/auth'));

//Serve static assets in productio
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.send(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
app.listen(port, () => {
  console.log(`server started in port ${port}`);
});
