const list = document.getElementById('checklist');
const message =  document.getElementById('message');
const trash = document.getElementsByClassName("fa-trash-o");
const checkboxes = document.getElementsByClassName("item-box");
const completeBtn = document.getElementById("complete-btn");

if (list){

  

Array.from(checkboxes).forEach(function(element) {
      element.addEventListener('click', function(){
        const jobId = list.dataset.id;
        fetch('/jobs/' + jobId +'/items/' + element.dataset.itemId, {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            done: element.checked
          })
        })
        .then(response => {
          if (response.ok) 
            element.checked =! element.checked
            return response.json()

        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});

}

if(completeBtn){
completeBtn.addEventListener('click', function(){
  const jobId = list.dataset.id;
  fetch('/jobs/' + jobId +'/complete', {
          method: 'put'})

  .then(res => res.json().then(data =>{
    if(!res.ok){
      message.textContent = data.error
      return

    }

  window.location.reload()

  }))


})

  

}




Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const li = this.closest('li');
        const id = li.dataset.id;
        fetch('/jobs/' + id, {
          method: 'delete'})
          .then(function (response) {
          window.location.reload()
        })
      })
});


