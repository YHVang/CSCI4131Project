// this package behaves just like the mysql one, but uses async await instead of
// callbacks.
const mysql = require(`mysql-await`); // npm install mysql-await
// first -- I want a connection pool: https://www.npmjs.com/package/mysql#pooling-connections
// this is used a bit differently, but I think it's just better -- especially if
//server is doing heavy work.
var connPool = mysql.createPool({
  connectionLimit: 5, // it's a shared resource, let's not go nuts.
  host: "127.0.0.1",// this will work
  user: "C4131F24U118",
  database: "C4131F24U118",
  password: "13974", // we really shouldn't be saving this here long-term-- and I probably shouldn't be sharing it with you...
});
// later you can use connPool.awaitQuery(query, data) -- it will return a promisefor the query results.
async function addListing(data) {
  // you CAN change the parameters for this function.
  const { title, url, description, category, sale_date, end_time } = data;
  const result = await connPool.awaitQuery('INSERT INTO Vehicle(title,url,description,category,sale_date,end_time) values (?,?,?,?,?,?)', [title, url, description, category, sale_date, end_time]);
  // console.log("Insert Result ->>>>", result);
  // console.log("chekcing to see what data.insertID shows", result.insertId);
  return result.insertId
}
async function deleteListing(id) {
  if (!id) {
    throw new Error("Invalid ID provided");
  }

  const deleteBidsQuery = 'DELETE FROM bids WHERE bid_id = ?';
  const deleteVehicleQuery = 'DELETE FROM Vehicle WHERE id = ?';

  try {
    // Delete the bids associated with the vehicle first
    await connPool.awaitQuery(deleteBidsQuery, [id]);

    // delete the vehicle
    const result = await connPool.awaitQuery(deleteVehicleQuery, [id]);

    if (result.affectedRows === 0) {
      console.log(`No listing found with ID: ${id}`);
      return false;
    }

    console.log(`Listing with ID: ${id} deleted.`);
    return true;
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}


async function getListing(id) {
  try {
    const listingQuery = `SELECT * FROM Vehicle WHERE id = ?`;
    const [listing] = await connPool.awaitQuery(listingQuery, [id]);

    if (!listing || listing.length === 0) {
      throw new Error('Listing not found');
    }
    const bidsQuery = `
      SELECT bidder, amount AS bidAmount, comment, bid_id 
      FROM bids
      WHERE bid_id = ?
      ORDER BY amount DESC, bid_id DESC
    `;
    const bids = await connPool.awaitQuery(bidsQuery, [id]);
    //Should console.log Ford Mustang along with bids with bid_id 2
    // console.log({
    //   listing: listing,
    //   bids: bids
    // })

    // Return the listing with bids
    return {
      listing: listing,
      bids: bids
    };
  } catch (error) {
    console.error("Error fetching listing or bids:", error);
    throw new Error('Error fetching listing or bids');
  }
}

async function getGallery(query, category) {
  try {
    // Build the base SQL query to get vehicles and their bids
    let sql = `
      SELECT v.id, v.title, v.url, v.description, v.category, v.sale_date, v.end_time,
             b.bidder, b.amount, b.comment
      FROM Vehicle v
      LEFT JOIN bids b ON v.id = b.bid_id
      WHERE 1 = 1
    `;
    const params = [];


    if (category && category.toLowerCase() !== 'any') {
      sql += ` AND v.category = ?`;
      params.push(category);
    }

    if (query) {
      sql += ` AND (v.title LIKE ? OR v.description LIKE ?)`;
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery);
    }

    const results = await connPool.awaitQuery(sql, params);

    const formattedResults = results.reduce((acc, row) => {
      let vehicle = acc.find(v => v.id === row.id);

      if (!vehicle) {
  
        vehicle = {
          id: row.id,
          title: row.title,
          url: row.url,
          description: row.description,
          category: row.category,
          sale_date: row.sale_date,
          end_time: row.end_time,
          bids: [],
        };
        acc.push(vehicle);
      }

      if (row.bidder) {
        vehicle.bids.push({
          bidder: row.bidder,
          amount: row.amount,
          comment: row.comment,
        });
      }

      return acc;
    }, []);

    return formattedResults;
  } catch (error) {
    console.error("Error fetching gallery:", error);
    throw new Error('Error fetching gallery');
  }
}


async function placeBid({ listingId, bidder, amount, comment }) {
  try {
    if (!listingId || !bidder || !amount) {
      throw new Error('Invalid input: listingId, bidder, and amount are required.');
    }

    const listingCheckQuery = `
      SELECT * FROM Vehicle WHERE id = ?
    `;
    const [listing] = await connPool.awaitQuery(listingCheckQuery, [listingId]);

    if (!listing) {
      throw new Error(`Listing with ID ${listingId} does not exist.`);
    }

    const insertBidQuery = `
      INSERT INTO bids (bidder, amount, comment, bid_id)
      VALUES (?, ?, ?, ?)
    `;
    const result = await connPool.awaitQuery(insertBidQuery, [bidder, amount, comment || null, listingId]);

    const bidId = result.insertId;
    return {
      success: true,
      message: 'Bid placed successfully',
      bid: {
        id: bidId,
        listingId,
        bidder,
        amount,
        comment,
      },
    };
  } catch (error) {
    console.error('Error placing bid:', error);
    throw new Error('Error placing bid');
  }
}

async function getBids(listing_id) {
  try {
    if (!listing_id) {
      throw new Error("Invalid input: listing_id is required.");
    }

    const query = `
      SELECT bidder, amount AS bidAmount, comment, bid_id
      FROM bids
      WHERE bid_id = ?
      ORDER BY bid_id DESC
    `;

    const bids = await connPool.awaitQuery(query, [listing_id]);
    // console.log(bids);

    return bids;
  } catch (error) {
    console.error("Error fetching bids:", error);
    throw new Error("Error fetching bids");
  }
}

async function getHighestBid(listing_id) {
  try {
    if (!listing_id) {
      throw new Error("Invalid input: listing_id is required.");
    }

    const query = `
      SELECT MAX(amount) AS highestBid
      FROM bids
      WHERE bid_id = ?
    `;

    const [result] = await connPool.awaitQuery(query, [listing_id]);

    // console.log(result.highestBid);

    return result.highestBid || 0;
  } catch (error) {
    console.error("Error fetching the highest bid:", error);
    throw new Error("Error fetching the highest bid");
  }
}

module.exports = {
  addListing,
  deleteListing,
  getListing,
  getGallery,
  placeBid,
  getBids,
  getHighestBid
};

// Tests
// const carDetails = {
//   title: "Ford Mustang",
//   url: "https://images.unsplash.com/photo-1610378985708-ac6de045f9f3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   description: "Experience the thrill of driving with this iconic Ford Mustang, a true American muscle car. Its bold design and powerful engine make every drive an adventure, while the comfortable interior ensures you enjoy the ride. Take the wheel of this classic Mustang and feel the power and precision with every mile!",
//   category: "coupe",
//   numericID: 2,
//   sale_date: "09/15/2024",
//   end_time: "12/25/2024"
// };
// addListing(carDetails);
// console.log("Deleteing listing function from here");
// deleteListing(3);
// getListing(2);
// getGallery('Dodge', 'truck');
// const bidData = {
//   listingId: 2,
//   bidder: 'JohnDoe',
//   amount: 5000,
//   comment: 'Excited to win this car!',
// };
// placeBid(bidData);
// getBids(2);
// getHighestBid(2);
