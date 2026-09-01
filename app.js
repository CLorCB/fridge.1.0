const openAddButton = document.querySelector("#openAddButton");
const closeDialogButton = document.querySelector("#closeDialogButton");

const foodDialog = document.querySelector("#foodDialog");
const foodForm = document.querySelector("#foodForm");

const foodList = document.querySelector("#foodList");
const emptyState = document.querySelector("#emptyState");

const dialogTitle = document.querySelector("#dialogTitle");
const saveButton = document.querySelector("#saveButton");

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
  当前正在编辑哪一个食材。
  null 表示现在不是编辑，而是在添加新食材。
*/

let editingId = null;


/*
  读取已经保存的食材
*/

let foods = loadFoods();


function loadFoods() {

  const savedFoods = localStorage.getItem("myFridgeFoods");

  if (!savedFoods) {
    return [];
  }

  try {
    return JSON.parse(savedFoods);
  } catch {
    return [];
  }

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
  获取今天日期
*/

function getToday() {

  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/*
  打开“添加食材”
*/

openAddButton.addEventListener("click", () => {

  editingId = null;

  foodForm.reset();

  foodDate.value = getToday();

  dialogTitle.textContent = "添加食材";
  saveButton.textContent = "保存";

  foodDialog.showModal();

});


/*
  关闭窗口
*/

closeDialogButton.addEventListener("click", () => {

  foodDialog.close();

});


/*
  保存
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


  /*
    添加新食材
  */

  if (editingId === null) {

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

  }


  /*
    编辑已有食材
  */

  else {

    const food = foods.find(
      food => food.id === editingId
    );


    if (food) {

      food.name = foodName.value.trim();

      food.location = foodLocation.value;

      food.status = foodStatus.value;

      food.tags = selectedTags;

      food.quantity = foodQuantity.value.trim();

      food.date = foodDate.value;

      food.note = foodNote.value.trim();

    }

  }


  saveFoods();

  renderFoods();

  foodDialog.close();

  editingId = null;

});


/*
  编辑食材
*/

function editFood(id) {

  const food = foods.find(
    food => food.id === id
  );


  if (!food) {
    return;
  }


  editingId = id;


  foodName.value = food.name;

  foodLocation.value = food.location;

  foodStatus.value = food.status;

  foodQuantity.value = food.quantity || "";

  foodDate.value = food.date || "";

  foodNote.value = food.note || "";


  /*
    先取消所有 Tag（标签）
  */

  document
    .querySelectorAll('input[name="foodTag"]')
    .forEach(input => {

      input.checked = false;

    });


  /*
    再勾选这个食材已有的 Tag（标签）
  */

  food.tags.forEach(tag => {

    const input = document.querySelector(
      `input[name="foodTag"][value="${tag}"]`
    );

    if (input) {
      input.checked = true;
    }

  });


  dialogTitle.textContent = "编辑食材";

  saveButton.textContent = "保存修改";


  foodDialog.showModal();

}


/*
  删除食材
*/

function deleteFood(id) {

  const food = foods.find(
    food => food.id === id
  );


  if (!food) {
    return;
  }


  const confirmed = confirm(
    `确定删除“${food.name}”吗？`
  );


  if (!confirmed) {
    return;
  }


  foods = foods.filter(
    food => food.id !== id
  );


  saveFoods();

  renderFoods();

}


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

        ${
          food.date
            ? ` · ${food.date}`
            : ""
        }

      </div>


      ${
        tagsHtml
          ? `
            <div class="food-tags">
              ${tagsHtml}
            </div>
          `
          : ""
      }


      ${
        food.note
          ? `
            <div class="food-note">
              ${food.note}
            </div>
          `
          : ""
      }


      <div class="food-actions">

        <button
          class="edit-button"
          data-id="${food.id}"
        >
          编辑
        </button>


        <button
          class="delete-button"
          data-id="${food.id}"
        >
          删除
        </button>

      </div>

    `;


    const editButton = card.querySelector(
      ".edit-button"
    );

    const deleteButton = card.querySelector(
      ".delete-button"
    );


    editButton.addEventListener("click", () => {

      editFood(food.id);

    });


    deleteButton.addEventListener("click", () => {

      deleteFood(food.id);

    });


    foodList.appendChild(card);

  });

}


/*
  页面打开时显示已有食材
*/

renderFoods();
