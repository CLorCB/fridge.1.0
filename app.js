/*
  注册 Service Worker（离线缓存脚本）
*/

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./service-worker.js")

      .catch(error => {

        console.error(
          "Service Worker 注册失败：",
          error
        );

      });

  });

}
const exportButton = document.querySelector("#exportButton");
const importButton = document.querySelector("#importButton");
const importFile = document.querySelector("#importFile");
const openAddButton = document.querySelector("#openAddButton");
const closeDialogButton = document.querySelector("#closeDialogButton");

const foodDialog = document.querySelector("#foodDialog");
const foodForm = document.querySelector("#foodForm");

const foodList = document.querySelector("#foodList");
const emptyState = document.querySelector("#emptyState");

const dialogTitle = document.querySelector("#dialogTitle");
const saveButton = document.querySelector("#saveButton");

const searchBox = document.querySelector("#searchBox");

const locationFilters = document.querySelector("#locationFilters");
const otherFilters = document.querySelector("#otherFilters");

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
  当前编辑的食材
*/

let editingId = null;


/*
  当前筛选条件
*/

let activeLocation = "all";

let activeStatus = null;

let activeTags = new Set();


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
  防止食材名称里的特殊符号
  被当成网页代码
*/

function escapeHtml(text) {

  const div = document.createElement("div");

  div.textContent = text ?? "";

  return div.innerHTML;

}


/*
  打开添加食材窗口
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
  保存新食材或修改
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
    添加
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
    修改
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
  编辑
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


  document
    .querySelectorAll('input[name="foodTag"]')
    .forEach(input => {

      input.checked = false;

    });


  (food.tags || []).forEach(tag => {

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
  删除
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
  存放位置筛选
*/

locationFilters.addEventListener("click", (event) => {

  const button = event.target.closest(
    "[data-location]"
  );


  if (!button) {
    return;
  }


  activeLocation = button.dataset.location;


  locationFilters
    .querySelectorAll(".filter")
    .forEach(filter => {

      filter.classList.remove("active");

    });


  button.classList.add("active");


  renderFoods();

});


/*
  生熟状态和 Tag（标签）筛选
*/

otherFilters.addEventListener("click", (event) => {

  const button = event.target.closest(".filter");


  if (!button) {
    return;
  }


  /*
    生 / 熟
    两者互斥
  */

  if (button.dataset.status) {

    const selectedStatus = button.dataset.status;


    if (activeStatus === selectedStatus) {

      activeStatus = null;

      button.classList.remove("active");

    }

    else {

      activeStatus = selectedStatus;


      otherFilters
        .querySelectorAll("[data-status]")
        .forEach(statusButton => {

          statusButton.classList.remove("active");

        });


      button.classList.add("active");

    }

  }


  /*
    Tag（标签）
    可以同时选择多个
  */

  if (button.dataset.tag) {

    const tag = button.dataset.tag;


    if (activeTags.has(tag)) {

      activeTags.delete(tag);

      button.classList.remove("active");

    }

    else {

      activeTags.add(tag);

      button.classList.add("active");

    }

  }


  renderFoods();

});


/*
  搜索
*/

searchBox.addEventListener("input", () => {

  renderFoods();

});


/*
  根据当前条件决定
  一个食材是否应该显示
*/

function foodMatchesFilters(food) {

  /*
    存放位置
  */

  if (
    activeLocation !== "all" &&
    food.location !== activeLocation
  ) {

    return false;

  }


  /*
    生熟
  */

  if (
    activeStatus &&
    food.status !== activeStatus
  ) {

    return false;

  }


  /*
    Tag（标签）
  */

  const foodTags = food.tags || [];


  for (const tag of activeTags) {

    if (!foodTags.includes(tag)) {

      return false;

    }

  }


  /*
    搜索文字
  */

  const searchText = searchBox.value
    .trim()
    .toLowerCase();


  if (searchText) {

    const searchableText = `
      ${food.name || ""}
      ${food.note || ""}
      ${food.quantity || ""}
    `.toLowerCase();


    if (!searchableText.includes(searchText)) {

      return false;

    }

  }


  return true;

}


/*
  显示食材
*/

function renderFoods() {

  foodList.innerHTML = "";


  /*
    只取符合条件的食材
  */

  const visibleFoods = foods.filter(
    foodMatchesFilters
  );


  /*
    完全没有食材
  */

  if (foods.length === 0) {

    foodList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🥬
        </div>

        <h2>
          冰箱还是空的
        </h2>

        <p>
          点上面的“添加食材”开始记录
        </p>

      </div>

    `;

    return;

  }


  /*
    有食材，但当前筛选没有结果
  */

  if (visibleFoods.length === 0) {

    foodList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔍
        </div>

        <h2>
          没找到
        </h2>

        <p>
          换个筛选条件或搜索内容试试
        </p>

      </div>

    `;

    return;

  }


  /*
    显示符合条件的食材
  */

  visibleFoods.forEach(food => {

    const card = document.createElement("article");

    card.className = "food-card";


    const tagsHtml = (food.tags || [])
      .map(tag => {

        return `
          <span class="food-tag">
            ${tagNames[tag] || tag}
          </span>
        `;

      })
      .join("");


    card.innerHTML = `

      <div class="food-card-top">

        <h3 class="food-name">
          ${escapeHtml(food.name)}
        </h3>

        <div class="food-quantity">
          ${escapeHtml(food.quantity || "")}
        </div>

      </div>


      <div class="food-info">

        ${locationNames[food.location] || ""}

        ·

        ${statusNames[food.status] || ""}

        ${
          food.date
            ? ` · ${escapeHtml(food.date)}`
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
              ${escapeHtml(food.note)}
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


    card
      .querySelector(".edit-button")
      .addEventListener("click", () => {

        editFood(food.id);

      });


    card
      .querySelector(".delete-button")
      .addEventListener("click", () => {

        deleteFood(food.id);

      });


    foodList.appendChild(card);

  });

}


/*
  页面第一次打开
*/

renderFoods();
/*
  导出备份
*/

exportButton.addEventListener("click", async () => {

  const backup = {

    /*
      backupVersion（备份版本号）
      以后数据结构改变时方便兼容旧备份
    */

    backupVersion: 1,

    exportedAt: new Date().toISOString(),

    foods: foods

  };


  const jsonText = JSON.stringify(
    backup,
    null,
    2
  );


  const fileName =
    `my-fridge-backup-${getToday()}.json`;


  /*
    File（文件对象）
  */

  const file = new File(
    [jsonText],
    fileName,
    {
      type: "application/json"
    }
  );


  /*
    iPhone 等支持 Web Share API（网页分享接口）的设备
    优先打开系统分享菜单。

    可以在那里选择：
    “存储到文件”
    iCloud Drive（苹果云盘）等。
  */

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({
      files: [file]
    })
  ) {

    try {

      await navigator.share({
        files: [file],
        title: "我的冰箱备份"
      });

      return;

    } catch (error) {

      /*
        如果只是用户自己取消分享，
        什么都不用做
      */

      if (error.name === "AbortError") {
        return;
      }

    }

  }


  /*
    如果设备不支持分享文件，
    就使用普通下载
  */

  const blob = new Blob(
    [jsonText],
    {
      type: "application/json"
    }
  );


  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  link.remove();


  setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 1000);

});


/*
  点击“导入备份”
*/

importButton.addEventListener("click", () => {

  /*
    清空之前选择的文件
    这样连续选择同一个备份也能触发
  */

  importFile.value = "";

  importFile.click();

});


/*
  用户选择备份文件以后
*/

importFile.addEventListener("change", async () => {

  const file = importFile.files[0];


  if (!file) {
    return;
  }


  try {

    const text = await file.text();

    const backup = JSON.parse(text);


    /*
      正常的新备份格式：
      {
        backupVersion: 1,
        foods: [...]
      }

      同时也允许直接导入旧的数组格式，
      给以后修改留点余地。
    */

    let importedFoods;


    if (Array.isArray(backup)) {

      importedFoods = backup;

    }

    else if (
      backup &&
      Array.isArray(backup.foods)
    ) {

      importedFoods = backup.foods;

    }

    else {

      throw new Error(
        "无法识别这个备份文件"
      );

    }


    const confirmed = confirm(

      `这个备份里有 ${importedFoods.length} 条食材记录。\n\n` +
      `导入后会覆盖你现在的 ${foods.length} 条记录。\n\n` +
      `确定继续吗？`

    );


    if (!confirmed) {
      return;
    }


    foods = importedFoods;

    saveFoods();

    renderFoods();


    alert(
      `恢复成功，共导入 ${foods.length} 条食材。`
    );

  }

  catch (error) {

    console.error(error);

    alert(
      "导入失败。请选择由“我的冰箱”导出的 JSON（数据文件格式）备份。"
    );

  }

});
