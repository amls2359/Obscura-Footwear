const UserCollection = require('../models/user')
const Wishlist = require('../models/wishlist')
const Category = require('../models/category');
const AddressCollection= require('../models/address')
const bcrypt = require('bcrypt')


const userProfileget = async(req,res)=>
{
    console.log('user id is :',req.session.userid);
    try
    {
       const user= await UserCollection.findOne({_id:req.session.userid})
       console.log(user);
       res.render('userProfile',{user})
    }
    catch(error)
    {
        console.log(error);
        res.send(404).status('something went wrong!')
    }
}

const editProfileGet = async(req,res)=>
{
    try
    {
      const user = await UserCollection.findOne({_id:req.session.userid})
      res.render('editProfile',{user})

    }
    catch(error)
    {
      console.log(error.message);
      res.status(500).send('Internal server error')
      
    }
}

const editProfilePost = async(req,res)=>
{
    try
  {
   const userId = req.session.userid
   console.log('userid is :',userId );
   console.log('value:',req.body.username);
   console.log('value:',req.body.number);

   const updateUser = await UserCollection.findOneAndUpdate({_id:userId},{username:req.body.username,phone:req.body.number},{new:true})// Add this if you want to get the updated document returned
   console.log('updateduser:',updateUser);
   res.redirect('/userProfile')
  }
  catch(error)
  {
    console.log(error);
    res.status(500).send('Internal server error')
  }
}

const changePasswordGet = async(req,res)=>
{
   let errorMessage={currentPassword:'',newPassword:'',confirmPassword:''}
   res.render('changepassword',{errorMessage:errorMessage})
}

const changePasswordPost = async(req,res)=>
{
   const userId = req.session.userid
   console.log('session user id is :', userId);

   const {currentPassword,newPassword}=req.body
   console.log('current password is:',currentPassword);
   console.log('new password is:',newPassword);

   try
   {
     const user = await UserCollection.findById(userId)
      
     const isMatch = await bcrypt.compare(currentPassword,user.password)
     console.log('password match result:',isMatch);
     
   if (!isMatch) {
      return res.status(200).json({
        success: false,
        errors: {
          currentPassword: "Incorrect current password",
          newPassword: "",
          confirmPassword: ""
        }
      });
    }
     const hashedPassword = await bcrypt.hash(newPassword,10)
     user.password= hashedPassword 
     await user.save()
     res.redirect('/userProfile')
   }
   catch(error)
   {
    console.log(error);
    res.status(500).send("Internal server error")
  
   }
}

const showUserAddress = async(req,res)=>
{
   try
   {
     const userId = req.session.userid
     console.log('session id is:',userId);
     const addresses = await AddressCollection.find({userid:userId})
     console.log('address is :',addresses);
     res.render('userAddress',{addresses})
   }
   catch(error)
   {
    console.log(error);
    
   }
}

const addAddress = async(req,res)=>
{
   try
   {
     res.render('addAddress')
   }
   catch(error)
   {
      console.log(error);
      
   }
}

const addAddressPost = async(req,res)=>
{
  console.log('entered into the post');
  
  try
  {
     const userId= req.session.userid
     const address =
     {
       userid:userId,
       firstname: req.body.firstname,
       lastname:req.body.lastname,
       address:req.body.address,
       city :req.body.city,
       pincode:req.body.pincode,
       phone:req.body.phone,
       state:req.body.state,
       email:req.body.email
     }
     console.log('address is:',address);
     const result= await AddressCollection.insertMany([address])
     res.redirect('/userAddress')
     console.log(result);
  }
  catch(error)
  {
      console.log(error);
      
  }
}

const editAddressGet = async(req,res)=>
{
  try
  {
   const addressId = req.params.id
   console.log(`address id is :${addressId}`);
   const address= await  AddressCollection.findById(addressId)
     console.log(address);
     
   if(!address)
   {
      console.log('error fetching address');
       return res.status(404).send('Address not found');
      
   }
   else
   {
     res.render('editAddress',{address})
   }
  }
  catch(error)
  {
    console.log(error);
    res.status(500).send('An error occured')
    
  }

}

const editAddresspost = async (req, res) => {
  const addressId = req.params.id;
  const updatedAddress = req.body;
  console.log(`updated address is ${updatedAddress}`);
  
  try {
      // Update the address directly in the route handler
      const address = await AddressCollection.findByIdAndUpdate(
          addressId, 
          updatedAddress, 
          { new: true }
      );
      
      if (!address) {
          console.error('Address not found');
          return res.status(404).send('Address not found');
      }
      
      console.log('Address updated successfully:', address);
      res.redirect('/userAddress');
      
  } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).send('An error occurred while updating the address');
  }
};

const deleteAddress= async(req,res)=>
{
  
  const addressId = req.params.id
  console.log(`id is ${addressId}`);
  
  const address= await AddressCollection.findByIdAndDelete(addressId)
  .then((x)=>{
    console.log('address deleted',x);
    res.redirect('/userAddress')
    
  })
  .catch((x)=>
  {
    console.log('error in deletion');
    res.redirect('/userAddress')
    
  })
  
}

module.exports=
{
    userProfileget,
    editProfileGet,
    editProfilePost,
    changePasswordGet,
    changePasswordPost,
    showUserAddress,
    addAddress,
    addAddressPost,
    editAddressGet,
    editAddresspost,
    deleteAddress
}