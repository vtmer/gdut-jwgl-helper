module.exports = function (grunt) {

    grunt.initConfig({
        
        // 脚本基本信息
        pkg: grunt.file.readJSON('package.json'),
        
        // 文件夹路径
        dir: {
            src: './src',
            manifest: './src/manifest',
            build: './build',
            dist: './',
            test: './src/test',
            docs: './docs',
            nodeModules: './node_modules'
        },

        // 任务配置

        clean: {
            build: ['<%= dir.build %>']
        },

        concat: {
            build_gm: {
                src: [
                    '<%= dir.manifest %>/greasemonkey.js',
                    '<%= dir.src %>/gdut-jwgl-helper.js'
                ],
                dest: '<%= dir.build %>/gdut-jwgl-helper.gm.js'
            }
        },

        connect: {
            // 执行测试
            test: {
                options: {
                    base: [
                        '<%= dir.src %>',
                        '<%= dir.test %>',
                        '<%= dir.nodeModules %>',
                        '<%= dir.docs %>'
                    ],
                    port: 9000,
                    useAvailabePort: true
                }
            }
        },

        copy: {
            build_crx: {
                files: [
                    {
                        src: '<%= dir.src %>/gdut-jwgl-helper.js',
                        dest: '<%= dir.build %>/crx/gdut-jwgl-helper.js'
                    },
                    {
                        src: '<%= dir.manifest %>/crx.json',
                        dest: '<%= dir.build %>/crx/manifest.json'
                    },
                    {
                        src: '<%= dir.src %>/vendor/jquery.min.js',
                        dest: '<%= dir.build %>/crx/jquery.min.js'
                    }
                ]
            },

            publish_gm: {
                src: '<%= dir.build %>/gdut-jwgl-helper.gm.js',
                dest: '<%= dir.dist %>/gdut-jwgl-helper.<%= pkg.version %>.js'
            },

            publish_crx: {
                src: '<%= dir.build %>/crx.crx',
                dest: '<%= dir.dist %>/gdut-jwgl-helper.<%= pkg.version %>.crx'
            }
        },

        shell: {
            build_crx: {
                command: function () {
                    // 可以使用命令行参数 ``--chrome`` 来指定打包使用的 chrome
                    var chrome = grunt.option('chrome') || 'chromium',
                        pem = grunt.template.process(
                            '<%= dir.manifest %>/gdut-jwgl-helper.pem'
                    ),
                        cmd = chrome + ' --pack-extension=<%= dir.build %>/crx';

                    if (grunt.file.exists(pem)) {
                        cmd += ' --pack-extension-key=' + pem;
                    } else {
                        cmd += '&& mv <%= dir.build %>/crx.pem ' + pem;
                    }

                    return cmd;
                }
            }
        },

        watch: {
            src: {
                files: ['<%= dir.src %>/**/*.js', '<%= dir.src %>/**/*.json'],
                tasks: ['copy:build_crx', 'build_gm']
            }
        }

    });

    // 加载 grunt 的插件
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell');

    // 定义任务

    // 将脚本打包成 crx 格式
    grunt.registerTask('build_crx', [
        'copy:build_crx',
        'shell:build_crx'
    ]);

    // 将脚本打包成 greasemonkey 脚本格式
    grunt.registerTask('build_gm', [
        'concat:build_gm'
    ]);

    // 打包任务
    grunt.registerTask('package', [
        'clean:build',
        'build_gm',
        'build_crx'
    ]);

    // 发布任务
    grunt.registerTask('publish', [
        'package',
        'copy:publish_gm',
        'copy:publish_crx'
    ]);

    // 测试任务
    grunt.registerTask('test', [
        'connect:test:keepalive'
    ]);

    // 默认任务：
    //  - 运行测试用例的静态服务器
    //  - 检测代码改动并自动打包
    grunt.registerTask('default', [
        'connect:test',
        'watch:src'
    ]);

};
