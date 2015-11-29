'use strict';
var util = require('util'),
    yeoman = require('yeoman-generator');

var Generator = module.exports = function Generator(args, options, config) {
    yeoman.generators.NamedBase.apply(this, arguments);
}

util.inherits(Generator, yeoman.generators.Base);
util.inherits(Generator, yeoman.generators.NamedBase);

Generator.prototype.springFramework = function (packageName) {
    this.currentDT = new Date();
    this.template('spring/src/main/java/package', 'src/main/java/' + packageName , this, {});
    this.template('spring/src/main/resources', 'src/main/resources', this, {});
    this.template('static/html', 'src/main/resources/public', this, {});
    this.template('static/lib', 'src/main/webapp/lib', this, {});
    this.template('spring/pom.xml', 'pom.xml', this, {});
    this.template('spring/readme.md', 'readme.md', this, {});
    this.template('.npmignore', '.gitignore', this, {});
}

Generator.prototype.playFramework = function () {
}
