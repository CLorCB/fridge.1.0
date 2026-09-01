const openAddButton = document.querySelector("#openAddButton");
const closeDialogButton = document.querySelector("#closeDialogButton");

const foodDialog = document.querySelector("#foodDialog");
const foodForm = document.querySelector("#foodForm");

const foodList = document.querySelector("#foodList");
const emptyState = document.querySelector("#emptyState");

const foodName = document.querySelector("#foodName");
const foodLocation = document.querySelector("#foodLocation");
const foodStatus = document.querySelector("#foodStatus");
const foodQuantity = document.querySelector("#foodQuantity");
const foodDate = document.querySelector("#foodDate");
const foodNote = document.querySelector("#foodNote");


const locationNames = {
  "fridge": "冷藏",
  "small-freezer": "小冷冻",
  "large-freezer": "大冷冻"
};


const statusNames = {
  "raw": "生",
  "cooked": "熟"
};


const tagNames = {
  "opened": "已开封",
  "semi-prepared": "半成品"
};


/*
  读取已经保存的食材
*/

let foods = loadFoods();


function loadFoods() {
  const savedFoods = localStorage.getItem("myFridgeFoods");

  if (!savedFoods) {
    return [];
  }

  return JSON.parse(savedFoods);
}


/*
  保存食材
*/

function saveFoods() {
  localStorage.setItem(
    "myFridgeFoods",
    JSON.stringify(foods)
  );
}


/*
  今天日期
*/

function getToday() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/*
  打开添加食材窗口
*/

openAddButton.addEventListener("click", () => {

  foodForm.reset();

  foodDate.value = getToday();

  foodDialog.showModal();

});


/*
  关闭窗口
*/

closeDialogButton.addEventListener("click", () => {
  foodDialog.close();
});


/*
  保存新食材
*/

foodForm.addEventListener("submit", (event) => {

  event.preventDefault();


  const selectedTags = Array
    .from(
      document.querySelectorAll(
        'input[name="foodTag"]:checked'
      )
    )
    .map(input => input.value);


  const newFood = {

    id: Date.now(),

    name: foodName.value.trim(),

    location: foodLocation.value,

    status: foodStatus.value,

    tags: selectedTags,

    quantity: foodQuantity.value.trim(),

    date: foodDate.value,

    note: foodNote.value.trim()

  };


  foods.push(newFood);

  saveFoods();

  renderFoods();

  foodDialog.close();

});


/*
  把食材显示在首页
*/

function renderFoods() {

  foodList.innerHTML = "";


  if (foods.length === 0) {

    foodList.appendChild(emptyState);

    return;

  }


  foods.forEach(food => {

    const card = document.createElement("article");

    card.className = "food-card";


    const tagsHtml = food.tags
      .map(tag => {
        return `
          <span class="food-tag">
            ${tagNames[tag]}
          </span>
        `;
      })
      .join("");


    card.innerHTML = `
      <div class="food-card-top">

        <h3 class="food-name">
          ${food.name}
        </h3>

        <div class="food-quantity">
          ${food.quantity || ""}
        </div>

      </div>


      <div class="food-info">

        ${locationNames[food.location]}
        ·
        ${statusNames[food.status]}

        ${food.date
          ? ` · ${food.date}`
          : ""
        }

      </div>


      ${
        tagsHtml
          ? `<div class="food-tags">${tagsHtml}</div>`
          : ""
      }


      ${
        food.note
          ? `<div class="food-note">${food.note}</div>`
          : ""
      }
    `;


    foodList.appendChild(card);

  });

}


/*
  页面打开时显示已有食材
*/

renderFoods();
