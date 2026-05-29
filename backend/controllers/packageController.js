const Packages = require('../models/Package');
const {
  buildPaginatedResponse,
  escapeRegex,
  parsePaginationQuery,
} = require("../utils/pagination");

exports.createPackage = async(req,res) => {
    try{
        const { name, price, pages } = req.body;
        const existingPackage = await Packages.findOne({name});
        if(existingPackage){
            return res.status(400).json({message: 'Package Already Exists'});
        }
        const newPackage = await Packages.create({
            name,price,pages
        });
        res.status(200).json({message: 'Package Created Succesfully', Packages:{
            _id:newPackage.id,
            name:newPackage.name,
            price:newPackage.price,
            pages:newPackage.pages
        }});

    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.getpackages = async(req, res) => {
    try{
        const {
            page,
            limit,
            skip,
            sortBy,
            sortOrder,
            search,
        } = parsePaginationQuery(req.query, {
            defaultLimit: 10,
            defaultSortBy: "name",
            defaultSortOrder: "asc",
            allowedSortFields: ["name", "price", "pages"],
        });

        const query = {};

        if (search) {
            const regex = new RegExp(escapeRegex(search), "i");
            query.$or = [{ name: regex }];
        }

        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1, _id: 1 };

        const [allPackages, total] = await Promise.all([
            Packages.find(query).select("name price pages").sort(sort).skip(skip).limit(limit).lean(),
            Packages.countDocuments(query),
        ]);

        res.status(200).json(buildPaginatedResponse(allPackages, page, limit, total));
    }
    catch(err){
        return res.status(400).json({ message: err.message });
    }
}

exports.getpackagesNames = async (req, res) => {
  try {
    const packageNames = await Packages.find().select("name price"); // ✅ include price
    res.status(200).json(packageNames);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.editpackages = async(req,res) => {
    try{
        const {id} = req.params;
        const {name,price,pages} = req.body;

        const package = await Packages.findById(id);

        if(!package){
            return res.status(400).json({message:'Package not Found'});
        }
        package.name = name;
        package.price = price;
        package.pages = pages

        await package.save();
        res.status(200).json({message:'Package Updated Succesfully'});
    }
    catch(err){
        res.status(400).json(err.message);
    }
}

exports.deletepackages = async(req,res) => {
    try{
        const {id} = req.params;
        await Packages.findByIdAndDelete(id);
        res.status(200).json({message:'Package Deleted Successfully'});
    }
    catch(err){
        res.status(400).json(err.message);
    }
}
