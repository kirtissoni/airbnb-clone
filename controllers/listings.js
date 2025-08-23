const fetch = require("node-fetch");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.filterByCategory = async (req, res) => {
  const { category } = req.params;
  const allListings = await Listing.find({ category });

  if (allListings.length === 0) {
    req.flash("error", `No listings found in category: ${category}`);
    return res.redirect("/listings");
  }

  res.render("listings/index.ejs", { allListings, category });
};

module.exports.showListings = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("req.file:", req.file);
    console.log("req.body.listing:", req.body.listing);

    let url = req.file?.path;
    let filename = req.file?.filename;

    // --- Geocoding ---
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        req.body.listing.location
      )}`,
      {
        headers: {
          "User-Agent": "Airbnb-Clone-App/1.0 (kibhumi@gmail.com)",
        },
      }
    );

    let geoData = [];
    try {
      geoData = await geoResponse.json();
    } catch (err) {
      console.error("Error parsing geocoding JSON:", err);
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // --- Image handling ---
    if (url && filename) {
      newListing.image = { url, filename };
    } else {
      newListing.image = {
        url: "https://via.placeholder.com/600x400?text=No+Image+Available",
        filename: "default",
      };
    }

    // --- Save coordinates if available ---
    if (geoData.length > 0) {
      newListing.geometry = {
        type: "Point",
        coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)],
      };
    } else {
      newListing.geometry = {
        type: "Point",
        coordinates: [0, 0],
      };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

module.exports.searchListings = async (req, res) => {
  const { country, q } = req.query;

  let filter = {};

  if (country && country !== "") {
    filter.country = country; // filter based on country
  }

  if (q && q.trim() !== "") {
    filter.title = { $regex: q, $options: "i" }; // filter based on title/ destination
  }

  const allListings = await Listing.find(filter);

  if (allListings.length === 0) {
    req.flash("error", "No Listings found for your search");
    return res.redirect("/listings");
  }

  res.render("listings/index.ejs", { allListings });
};

module.exports.renderEditFrom = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!!");
  res.redirect("/listings");
};
