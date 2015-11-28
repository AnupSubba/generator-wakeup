'use strict';
var util = require('util'),
    path = require('path'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('underscore.string'),
    scriptBase = require('./app-base'),
    packagejs = require(__dirname + '/../package.json');

var WakeupGenerator = module.exports = function WakeupGenerator(args, options, config) {
    yeoman.generators.Base.apply(this, arguments);
};

util.inherits(WakeupGenerator, scriptBase);

WakeupGenerator.prototype.askFor = function askFor() {
    var cb = this.async();
    console.log(chalk.blue('http://wakeup.org.in'));
    console.log(chalk.green('Welcome to the Wakeup Generator '+ packagejs.version + '\n'));
    var questions = 3;
    var defaultAppBaseName = (/^[a-zA-Z0-9_]+$/.test(path.basename(process.cwd())))?path.basename(process.cwd()):'wakeup';
    var prompts = [
        {
            type: 'input',
            name: 'baseName',
            validate: function (input) {
                if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                return 'Your application name cannot contain special characters or a blank space, using the default name instead';
            },
            message: '(1/' + questions + ') What is the base name of your application?',
            default: defaultAppBaseName
        },
        {
            type: 'input',
            name: 'packageName',
            validate: function (input) {
                if (/^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/.test(input)) return true;
                return 'The package name you have provided is not a valid Java package name.';
            },
            message: '(2/' + questions + ') What is your default Java package name?',
            default: 'org.wakeup'
        },
        {
            type: 'list',
            name: 'frameworkType',
            message: '(3/' + questions + ') Which framework would you like to use?',
            choices: [
                {
                    value: 'spring',
                    name: 'Spring boot + MySQL '
                }
            ],
            default: 0
        }
    ];

    this.baseName = this.config.get('baseName');
    this.applicationName = this.config.get('applicationName');
    this.packageName = this.config.get('packageName');
    this.packageFolder = this.config.get('packageFolder');
    this.frameworkType = this.config.get('frameworkType');
    this.packagejs = packagejs;

    if (this.baseName != null &&
        this.applicationName != null &&
        this.packageName != null &&
        this.packageFolder != null &&
        this.frameworkType != null) {
        console.log(chalk.green('This is an existing project, using the configuration from your .yo-rc.json file \n' +
            'to re-generate the project...\n'));
        cb();
    } else {
        this.prompt(prompts, function (props) {
            this.baseName = props.baseName;
            this.packageName = props.packageName;
            this.frameworkType = props.frameworkType;
            this.packageFolder = this.packageName.replace(/\./g, '/');
            this.applicationName = _.capitalize(this.baseName) + 'App';
            cb();
        }.bind(this));
    }
};

WakeupGenerator.prototype.generateApp = function generateApp() {
    switch (this.frameworkType) {
        case 'spring':
            this.springFramework(this.packageName);
            break;
        case 'play':
            this.playFramework();
            break;
        default:
            return;
    }
  
    // Set configuration to '.yo-rc.json'
    this.config.set('baseName', this.baseName);
    this.config.set('applicationName', this.applicationName);
    this.config.set('packageName', this.packageName);
    this.config.set('packageFolder', this.packageFolder);
    this.config.set('frameworkType', this.frameworkType);
};
