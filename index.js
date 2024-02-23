const PORT = 5000;
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { datacatalog } = require("googleapis/build/src/apis/datacatalog");

// connection with mongo
const connect = async() =>{
    try{
        await mongoose.connect("mongodb+srv://alokkumar2297812:1234@cluster0.ji5kxkb.mongodb.net/?retryWrites=true&w=majority")
        console.log("Connected to MongoDb");
    }
    catch(err){
        console.log(err);
    }
}


app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hi I am Alok");
})

//Image Storage Enginer

const storage = multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//Creating Image uploading Endpoints

app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${PORT}/images/${req.file.filename}`
    })
})

//Schema for creating Products

const Products = mongoose.model("Product",{
    id:{
        type: Number,
        require: true
    },
    name:{
        type:String,
        require: true
    },
    image:{
        type:String,
        require:true
    },
    category:{
        type:String,
        require:true
    },
    new_price:{
        type:Number,
        require:true
    },
    old_price:{
        type:Number,
        require:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true
    }
})

app.post("/addproduct",async (req,res)=>{
    let products = await Products.find({});
    let id;
    if(products.length>0){
        let last_product = products[products.length-1];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Products({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price
    });
    console.log(product);
    await product.save();
    res.status(200).json({product,success:1});
})

//Creating Apis for deleting the product

app.post("/removeproduct",async (req,res)=>{
    const product = await Products.findOneAndDelete({id:req.body.id});
    console.log("Removed!");
    res.status(200).json({product,success:1});
})


//Creating Api for getting all the products
app.get("/allproducts",async (req,res)=>{
    let product = await Products.find({});
    console.log("All products fetched");
    res.send(product);
})


//Schema creating for user Model

const Users = mongoose.model('Users',{
    name:{
        type:String
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String
    },
    cartData:{
        type:Object
    },
    data:{
        type:Date,
        default:Date.now,
    }
})

//Creating Endpoint for registering user

app.post("/signup", async(req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({succes:false,error:"Existing User Found with the same email."})
    }
    let cart = {};
    for(let i=0;i<300;i++){
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:1,token})
})

//End point for User login

app.post("/login",async(req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }else{
            res.json({success:false,error:"Wrong password"});
        }
    }
    else{
        res.json({success:false,error:"Wrong Email Id"})
    }
})

//Endpoints for new collections data

app.get("/newCollections", async(req,res)=>{
    let products = await Products.find({});
    let newCollections = products.slice(1).slice(-8);

    console.log("NewCollections fetched");
    res.send(newCollections);
})



app.listen(PORT,()=>{
    console.log("Port is Running at 5000");
    connect()
})
