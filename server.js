const express = require('express');
const app = express();
// const pug = require('pug');

///Need to look and modify
const { addListing, getListing, getGallery, placeBid, deleteListing } = require('./data.js'); // Using functions from data.js

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/css', express.static('resources/css'));
app.use("/js", express.static("resources/js/"));
app.use("/images", express.static("resources/images/"));

app.set("views", "templates");
app.set("view engine", "pug");

const port = 4131;

app.get("/", (req, res) => {
    res.render("main.pug");
});

app.get("/main.pug", (req, res) => {
    res.render("main.pug");
});

app.get("/myTodo.pug", (req, res) => {
    res.render("myTodo.pug");
});

app.get("/category.pug", (req, res) => {
    res.render("category.pug");
});

app.get("/test.pug", (req, res) => {
    res.render("test.pug");
});

app.all('*', (req, res) => {
    res.status(404).render('404');
});

//Get Requests
//Get category, Create To-Do, Delete To-Do

//Get category, still need to modifiy
app.get('/api/category', async (req, res) => {
    // Get query parameter for search
    const queryTerm = req.query.query || '';
    // Get category parameter
    const category = req.query.category || '';

    try {
        // Fetch listings from the database
        const listings = await getGallery(queryTerm, category);
        res.json(listings);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: 'Error fetching category' });
    }
});

//Not sure if i need.
app.get("/listing/:id", async (req, res) => {
    const listingId = parseInt(req.params.id);

    try {
        const { listing, bids } = await getListing(listingId);
        const bidder_name = req.cookies?.bidder_name || '';
        res.render('listing.pug', { listing, bids, bidder_name });
    } catch (err) {
        res.status(404).render('404.pug');
    }
});

// Create new To-do, Still need to modifiy.
app.post("/create", async (req, res) => {
    const { listingTitle, imgInput, textA, carsCat, date } = req.body;
  
    if (!listingTitle || !imgInput || !textA || !carsCat || !date) {
      return res.status(400).render('create_fail');
    }
  
    const newListingData = {
      title: listingTitle,
      url: imgInput,
      description: textA,
      category: carsCat,
      sale_date: date,
      end_time: date
    };
  
    try {
      const newListingId = await addListing(newListingData);
      res.render('create_success', { listingId: newListingId });
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).render('create_fail');
    }
  });

  //Delete "listing/Category" still need to modify.
  app.delete('/api/delete_listing', async (req, res) => {
    const { listing_id } = req.body;
  
    if (!listing_id) {
      return res.status(400).json({ message: 'Missing listing_id' });
    }
  
    try {
      const result = await deleteListing(listing_id);
      if (result) {
        res.json({ message: 'Listing successfully deleted' });
      } else {
        res.status(404).json({ message: 'Listing not found' });
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({ message: 'Error deleting listing' });
    }
  });



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});