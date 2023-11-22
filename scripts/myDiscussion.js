var sortSelect = document.getElementById('sort-type');

function fetchDataAndDisplay(userID, sort, order) {
  const dataContainer = document.getElementById('dataContainer');

  // Retrieve form submission data from Firestore based on the user ID
  db.collection('discussionSubmissions')
      .where('userID', '==', userID) // Add this line to filter by user ID
      .orderBy(sort, order)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Create HTML elements based on the data
        const dataElement = document.createElement('div');
        dataElement.className = 'card';

        const time = data.timestamp;

        const dateObject = time.toDate();

        const year = dateObject.getFullYear();
        const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const day = dateObject.getDate().toString().padStart(2, '0');

        // Extracting time components
        const hours = dateObject.getHours().toString().padStart(2, '0');
        const minutes = dateObject.getMinutes().toString().padStart(2, '0');

        const currentDate = new Date();

        const timeDifference = currentDate - dateObject;

        // Convert milliseconds to hours
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        // Convert milliseconds to days
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        var status;
        // Check if 24 hours have passed
        if (daysDifference > 3) {
          status = "Past";
        }
        else if (hoursDifference >= 24) {
            status = "Recent";
        } else {
            status = data.action;
        }

        // Formatting the date and time
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;

        if (data.image) {
        dataElement.innerHTML = `
          <div class="card-header">
            <span class="tag tag-teal" id="title">${status}</span>
            <span class="tag tag-purple" id="title">${data.concern}</span>
            <span class="tag tag-pink" id="title">${data.location}</span>
          </div>
          <div class="card-body">
            <div class="user">
              <h1 id="details">${data.title}</h1>
              <small id="timestamp">${formattedDateTime}</small>
              <h5 id="name">${data.name}</h5>
            </div>
            <div class="card-details">
              <div class="card-image">
                <img src="${data.image}" alt="${data.title}" />
              </div> 
              <p>${data.details}</p>
            </div>
            <div id="like-section">
              <button id="like-image" onclick="likePost('${
                doc.id
              }', '${data.likes || 0}')">Like</button>
              <h5 id="likeCount"><span id="like-number">${data.likes || 0}</span></h5>
              <button onclick="DislikePost('${doc.id}', '${
              data.likes || 0
                }')">Dislike</button>
            </div>
          </div>
        `;
        } else {
          dataElement.innerHTML = `
          <div class="card-header">
            <span class="tag tag-teal" id="title">${status}</span>
            <span class="tag tag-purple" id="title">${data.concern}</span>
            <span class="tag tag-pink" id="title">${data.location}</span>
          </div>
          <div class="card-body">
            <div class="user">
              <h1 id="details">${data.title}</h1>
              <small id="timestamp">${formattedDateTime}</small>
              <h5 id="name">${data.name}</h5>
            </div>
            <div class="card-details">
              <p>${data.details}</p>
            </div>
            <div id="like-section">
              <button id="like-image" onclick="likePost('${
                doc.id
              }', '${data.likes || 0}')">Like</button>
              <h5 id="likeCount"><span id="like-number">${data.likes || 0}</span></h5>
              <button onclick="DislikePost('${doc.id}', '${
              data.likes || 0
                }')">Dislike</button>
            </div>
          </div>
          `;
        }

        // Append the HTML to the container
        dataContainer.appendChild(dataElement);
      });
    })
    .catch((error) => {
      console.error('Error reading Firestore data:', error);
    });

}

firebase.auth().onAuthStateChanged(user => {

  var sort;
  var order;

  if (localStorage.getItem('dropdownValue')) {
    sortSelect.value = localStorage.getItem('dropdownValue');
    var sortType = localStorage.getItem('dropdownValue');
  }

  if (sortType == 'New') {
    sort = "timestamp";
    order = "desc";
  } else if (sortType == 'Old') {
    sort = "timestamp";
    order = "asc";
  } else if (sortType == 'Concern') {
    sort = "concern";
    order = "asc";
  } else if (sortType == 'Likes') {
    sort = "likes";
    order = "desc";
  } else if (sortType == 'City') {
    sort = "location";
    order = "asc";
  }

  // Check if user is signed in:
  if (user) {
    currentUser = db.collection("users").doc(user.id)
  }
  const userID = firebase.auth().currentUser.uid;
  console.log(userID);
  // Call the function with the user ID
  fetchDataAndDisplay(userID, sort, order);
});

sortSelect.addEventListener("change", function() {
  localStorage.setItem('dropdownValue', this.value);
  changeSort();
});


function changeSort() {
  dataContainer.innerHTML = "";
  
  setTimeout(function() {
    window.location.href = "loadingMyDiscussion.html";
  }, 100);
}

//go to the correct user document by referencing to the user uid
firebase.auth().onAuthStateChanged((user) => {
  // Check if user is signed in:
  if (user) {
    currentUser = db.collection("users").doc(user.id);
  }
});

function likePost(docId, currentLikes) {

  // var up = document.getElementById('upvote');

  // toggleFontVariation(up);

  const userID = firebase.auth().currentUser.uid;
  const docRef = db.collection("discussionSubmissions").doc(docId);

  docRef.get().then((doc) => {
    if (doc.exists) {
      const likedBy = doc.data().likedBy || [];
      const dislikedBy = doc.data().dislikedBy || [];

      if (likedBy.includes(userID)) {
        // If previously liked and now unliking
        docRef.update({
          likes: parseInt(currentLikes) - 1,
          likedBy: firebase.firestore.FieldValue.arrayRemove(userID),
        }).then(() => {
          console.log("Document successfully updated!");
        });
      } else {
        // If not previously liked or changing from dislike to like
        docRef.update({
          likes: dislikedBy.includes(userID) ? parseInt(currentLikes) + 2 : parseInt(currentLikes) + 1,
          likedBy: firebase.firestore.FieldValue.arrayUnion(userID),
          dislikedBy: firebase.firestore.FieldValue.arrayRemove(userID),
        }).then(() => {
          console.log("Document successfully updated!");
        });
      }
    }
  });
}

function DislikePost(docId, currentLikes) {

  // var down = document.getElementById('downvote');

  // toggleFontVariation(down);

  const userID = firebase.auth().currentUser.uid;
  const docRef = db.collection("discussionSubmissions").doc(docId);

  docRef.get().then((doc) => {
    if (doc.exists) {
      const likedBy = doc.data().likedBy || [];
      const dislikedBy = doc.data().dislikedBy || [];

      if (dislikedBy.includes(userID)) {
        // If previously disliked and now undisliking
        docRef.update({
          likes: parseInt(currentLikes) + 1,
          dislikedBy: firebase.firestore.FieldValue.arrayRemove(userID),
        }).then(() => {
          console.log("Document successfully updated!");
        });
      } else {
        // If not previously disliked or changing from like to dislike
        docRef.update({
          likes: likedBy.includes(userID) ? parseInt(currentLikes) - 2 : parseInt(currentLikes) - 1,
          dislikedBy: firebase.firestore.FieldValue.arrayUnion(userID),
          likedBy: firebase.firestore.FieldValue.arrayRemove(userID),
        }).then(() => {
          console.log("Document successfully updated!");
        });
      }
    }
  });
}