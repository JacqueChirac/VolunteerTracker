<script>
   import emailjs from '@emailjs/browser';

   (function(){
      emailjs.init({
        publicKey: "InRSRMYq3D8DEYnU9",
      });
   })();

function init(){
   emailjs.init({
  publicKey: 'InRSRMYq3D8DEYnU9',
  blockHeadless: true,
  blockList: {
    list: [], //Currently none
    watchVariable: 'userEmail',    // This variable contains the email address
  },
  limitRate: {
    id: 'app',
    throttle: 3000, //Cooldown in ms
  },
});
}



var singleSendParams = { //Parameters defined in the template
subject: "Morning!",
name: "Kelp",
message: "I send you a message!",
time: 2008,
recipient: "liuzilin375@gmail.com",
};

/**
 * @param {any} params
 */
function SendEmail(params) {
emailjs.send('service_tni7nrg', 'template_s341t4v', params).then(
  (response) => {
    console.log('SUCCESS!', response.status, response.text);
  },
  (error) => {
    console.log('FAILED...', error);
  },
);
}


</script>


    <div>
        <label for="recipient">Recipient</label>
        <input type="text" id="recipient" bind:value={singleSendParams.recipient}/>
        <button onclick={()=>{
    SendEmail(singleSendParams);
}}>Send Email</button>
    </div>



<style>
    
</style>