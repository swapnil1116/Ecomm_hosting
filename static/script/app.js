let addTocart = document.querySelectorAll(".add-to-cart")

// addTocart.forEach((btn)=>{
//     // btn.addEventListener('click' , (e)=>{
//     //     let product = btn.dataset.product
//     //     console.log(product)
//     // })
// })
let cartCounter = document.querySelector('#cartCounter')
function updateData(product){
    axios.post('/update-cart' , product).then(res=>{
        console.log(res)
        cartCounter.innerText = res.data.totalQty
        new Noty({
            type:"success",
            timeout:1000,
            text: "Item added to cart"
          }).show();
    })
}

addTocart.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        let product = JSON.parse(btn.dataset.product)
        updateData(product)
    })
})

const alertMsg = document.querySelector('#success_alert')

if(alert) {
    setTimeout(() =>{
        alertMsg.remove()
    } , 3000)
}

