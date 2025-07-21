const OrderCollection = require('../models/order')
const Excel = require('exceljs')
const PDFDocument = require('pdfkit');
require('pdfkit-table');


const sales = async(req,res)=>
{
    try
    {
         const orderdetalist= await OrderCollection.find()  
         res.render('salesReport',{orderdetalist}) 
    }
    catch(error)
    {
      console.error(error);
      return res.status(500).send('failed to order page')
    }
}

const costomSales = async (req, res) => {
    try {
        const startDate = new Date(req.body.start_date);
        const endDate = new Date(req.body.end_date);
        const orderdetalist = await OrderCollection
            .find({ orderDate: { $gte: startDate, $lte: endDate } })
            .sort({ orderDate: -1 });
          console.log('orderdetails is :',orderdetalist );
          
     res.render('salesReport', {
      orderdetalist,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
    });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
}

const salesFilter = async(req,res)=>
{
  try
  {
    const reportTye= req.query.type
    const currentDate = new Date()
    let startDate
    let endDate = new Date()

    if(reportTye === 'daily')
    {
      startDate = new Date(currentDate.setHours(0,0,0,0))
    }
    else if(reportTye === 'weekly')
    {
      const first = currentDate.getDate() - currentDate.getDay()
      startDate  = new Date(currentDate.setDate(first))
       startDate.setHours(0,0,0,0)
    }
    else if(reportTye === 'monthly')
    {
      startDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),1)
    }

    endDate.setHours(23,59,59,999)

    const orderdetalist= await OrderCollection.find({
      orderDate:{$gte:  startDate ,$lte:endDate}
    }).sort({orderDate:-1})

    res.json(orderdetalist)
  }
  catch(error)
  {
    console.log(error);
    res.status(500).send('Internal Server Error')
    

  }
}

const ExcelReport = async(req,res)=>
{
  console.log(`enteredinto excel report`);
  
  try
  {
      const startDate = new Date(req.query.startingdate)
      const endDate = new Date(req.query.endingdate)
      console.log(`start date is ${startDate }`);
      console.log(`end date is ${ endDate}`);
      
      
      endDate.setDate( endDate.getDate()+1)

      const orderCursor = await OrderCollection.aggregate([
        {
          $match:{
            orderDate:{$gte:startDate,$lte:endDate}
          }
        }
      ])
      console.log(`${orderCursor}`);
      

      const workbook = new Excel.Workbook()
      const worksheet = workbook.addWorksheet('Sheet 1')

      worksheet.columns =[
        {header:'Username',key:'username',width:15},
        {header:'Product Name',key:'productname',width:20},
        {header:'Quantity',key:'quantity',width:15},
        {header:'Prices',key:'price',width:15},
        {header:'Status',key:'status',width:15},
        {header:'Order Date',key:'orderdate',width:18},
        {header:'Address',key:'address',width:30},
        {header:'City',key:'city',width:20},
        {header:'Pincode',key:'pincode',width:15},
        {header:'Phone',key:'phone',width:15}
      ]

      for(const orderItem of orderCursor )
      {
        for(const product of orderItem .productCollection )
        {
           console.log('orderitem is',orderItem);
           
       worksheet.addRow({
  'username': orderItem.addressCollection?.firstname || 'N/A',
  'productname': product.productname,
  'quantity': product.quantity,
  'price': product.price,
  'status': product.status,
  'orderdate': orderItem.orderDate.toLocaleString(),
  'address': orderItem.addressCollection?.address || 'N/A',
  'city': orderItem.addressCollection?.city || 'N/A',
  'pincode': orderItem.addressCollection?.pincode || 'N/A',
  'phone': orderItem.addressCollection?.phone || 'N/A'
});
        }
      }
    //  if (!orderCursor || orderCursor.length === 0) {
    // return res.status(404).send('No data available for selected date range.');
    //    }

      workbook .xlsx.writeBuffer().then((buffer)=>{
        const excelBuffer = Buffer.from(buffer)
        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition','attachment; filename=excel.xlsx')
        res.send(excelBuffer)
      })
  }
  catch(error)
  {
   console.error('Error creating or sending excel file:',error)
   res.status(500).send('Internal Server Error')
  }
}

const PDFReport = async (req, res) => {
  try {
    const startingDate = new Date(req.query.startingdate);
    const endingDate = new Date(req.query.endingdate);

    const orders = await OrderCollection.find({
      orderDate: { $gte: startingDate, $lte: endingDate }
    });

    const doc = new PDFDocument({ margin: 20, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();

    if (!orders || orders.length === 0) {
      doc.fontSize(12).text('No data available for the selected date range.', { align: 'center' });
      doc.end();
      return;
    }

    const rows = [];

    orders.forEach(order => {
      const user = order.addressCollection?.firstname || 'N/A';
      const address = order.addressCollection?.address || 'N/A';
      const city = order.addressCollection?.city || 'N/A';
      const pincode = order.addressCollection?.pincode || 'N/A';
      const phone = order.addressCollection?.phone || 'N/A';

      order.productCollection.forEach(product => {
        rows.push([
          String(user),
          String(product.productname || 'N/A'),
          String(product.price || 'N/A'),
          String(product.quantity || 'N/A'),
          String(address),
          String(city),
          String(pincode),
          String(phone)
        ]);
      });
    });

    const table = {
      headers: [
        'Username',
        'Product Name',
        'Price',
        'Quantity',
        'Address',
        'City',
        'Pincode',
        'Phone'
      ],
      rows
    };

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, i) => doc.font('Helvetica').fontSize(9)
    });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports={
    sales,
    costomSales,
    salesFilter,
    PDFReport ,
    ExcelReport 
}
