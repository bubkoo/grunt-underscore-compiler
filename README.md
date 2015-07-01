# grunt-underscore-compiler

> Compile underscore templates into JavaScript files.

## Getting Started

This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-underscore-compiler --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-underscore-compiler');
```

## The "underscore" task

### Overview

In your project's Gruntfile, add a section named `underscore_compiler` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  underscore: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.separator

Type: `String`

Default value: `linefeed + linefeed`

Concatenated files will be joined on this string.

#### options.indent

Type: `String`

Default value: `    `

By default 4 space indent is used for the generated code. 

#### options.quoteChar

Type: `String`

Default value: `'`

Strings are quoted with single quote-only by default. However, for projects that want strict double-quotes usage, you can specify:

```js
options: {
    quoteChar: '"'
}
```

#### options.raw

Type: `Boolean`

Default value: `true`

By default keep the HTML line break in the generated code. You can specify this option to `false` to get one line code, but you note that this option is not equal to htmlmin.

#### options.trim

Type: `Boolean`

Default value: `true`

By default trim each HTML line in the generated code, remove the space at the beginning and end for each line. You can specify this option to `false` to keep the space.

#### options.namespace

Type: `String` or `false` or `Function`

Default value: `app.tpl`

The namespace in which the precompiled templates will be assigned. Use dot notation (e.g. App.Templates) for nested namespaces or false for no namespace wrapping. When false with amd option set true, templates will be returned directly from the AMD wrapper.

Example:

```js
options: {
  namespace: 'MyApp.Templates'
}
```
You can generate nested namespaces based on the file system paths of your templates by providing a function. The function will be called with one argument (the template filepath). The function must return a dot notation based on the filepath.

Example:

```js
options: {
  namespace: function(filename) {
    var names = filename.replace(/modules\/(.*)(\/\w+\.hbs)/, '$1');
    return names.split('/').join('.');
  },
  demo: {
  	files: {
    	'ns_nested_tmpls.js' : [ 'modules/**/*.html']
  	}
  }
}
```

#### options.global

Type: `String`

Default value: `this`

The global object which the namespace belong to. 

Example:

```js
options: {
  namespace: 'MyApp.Templates',
  global: 'this'
}
```

The generated code will like:


```js
this[MyApp][Templates][SomeName] = 'your template';
```

#### options.amd

Type: `String` or `Boolean` or `Array`

Default value: `false`

Wraps the output file with an AMD define function and returns the compiled template namespace unless namespace has been explicitly set to false in which case the template function will be returned directly.

If String then that string will be used in the module definition `define(['your_amd_opt_here'])`.

If Array then those strings will be used in the module definition. 

#### options.compile

Type: `Boolean`

Default value: `false`

By default return the HTML string. Set to `true` will get precompiled template function.

#### options.templateSettings

Type: `Object`

Default value: `{}`

[underscore](http://underscorejs.org/#template)'s templateSettings.

### Usage Examples

```js
grunt.initConfig({
  underscore: {
    options: {
        namespace: 'MyApp.Templates'
    },
    demo:{
      files: {
        'path/to/result.js': 'path/to/source.html',
        'path/to/another.js': ["path/to/sources/*.html', 'path/to/more/*.html']
      }
    }
  }
});
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

- 2014-11-22   v0.0.1   Compile underscore templates into JavaScript files.
