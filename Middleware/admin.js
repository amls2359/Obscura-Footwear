const checkSession =async(req,res,next)=>
{
    console.log('Reached admin session');
    if(req.session && req.session.admin)
    {
        console.log('session found');
        next()
    }
    else
    {
        res.redirect('/admin/adminLogin')
    }
    
}

module.exports=
{
    checkSession
}