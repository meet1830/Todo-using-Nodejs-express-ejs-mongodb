// due to middleware this file available to both client and server side
// will only reflect when dashboard page is open as it is linked there only

console.log("Inside browser.js");

// under headers in inspect, content type mentioned. in react it is by default the value, but in js have to define it
const config = {
  headers: {
    "content-type": "application/json",
  },
};

// adding click event listener to all of the document. If clicked target contains class of button then that button is clicked and logic can be written for it.

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("add_item")) {
    // to prevent whole page from refreshing after adding item use prevent default
    event.preventDefault();

    const todoText = document.getElementById("create_field");

    if (todoText.value === "") {
      alert("Please enter todo text");
      return;
    }

    // making request to the server side in app.js to add and save the information in db
    // here sending the information that is to be saved
    // which is being captured as req, res in function argument in app.js
    axios
      .post(
        "/create-item",
        JSON.stringify({
          todo: todoText.value,
        }),
        config
      )
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        todoText.value = "";
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (event.target.classList.contains("edit-me")) {
    // the variable names should be same as backend request made in app.js
    const id = event.target.getAttribute("data-id");
    const newData = prompt("Enter your new todo text");

    axios
      .post(
        "/edit-item",
        JSON.stringify({
          id,
          newData,
        }),
        config
      )
      .then((res) => {
        console.log(res);
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        event.target.parentElement.parentElement.querySelector(
          ".item-text"
        ).innerHTML = newData;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (event.target.classList.contains("delete-me")) {
    const id = event.target.getAttribute("data-id");

    axios
      .post(
        "/delete-item",
        JSON.stringify({
          id,
        }),
        config
      )
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        event.target.parentElement.parentElement.remove();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  if (event.target.getAttribute("id") === "show_more") {
    console.log("show more");
    generateTodos();
  }
});

document.getElementById("item-list").insertAdjacentHTML(
  "beforeend",
  todos
    .map((item) => {
      return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
    <span class="item-text">
        ${item.todo}
    </span>
    <div>
        <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
        <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
    </div>
</li>`;
    })
    .join("")
    // here have to join otherwise will get commas between todos on render
);