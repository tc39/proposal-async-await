"use strict";

function Menu() {
  this.$toggle = document.getElementById('menu-toggle');
  this.$menu = document.getElementById('menu');

  this.$toggle.addEventListener('click', this.toggle.bind(this));

  var tocItems = this.$menu.querySelectorAll('#menu-toc li');
  for (var i = 0; i < tocItems.length; i++) {
    var $item = tocItems[i];
    $item.addEventListener('click', function($item, event) {
      $item.classList.toggle('active');
      event.stopPropagation();
    }.bind(null, $item));
  }

  var tocLinks = this.$menu.querySelectorAll('#menu-toc li > a');
  for (var i = 0; i < tocLinks.length; i++) {
    var $link = tocLinks[i];
    $link.addEventListener('click', function(event) {
      this.toggle();
      event.stopPropagation();
    }.bind(this));
  }
}

Menu.prototype.toggle = function () {
  this.$menu.classList.toggle("active");
}

function init() {
  var menu = new Menu();
}

document.addEventListener('DOMContentLoaded', init);
