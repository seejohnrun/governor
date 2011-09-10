require 'railsless-deploy' 

begin
  require 'capistrano/campfire'
rescue LoadError
  abort "No soup for you! =>gem install capistrano-campfire; gem install tinder"
end

# rvm
$:.unshift(File.expand_path('./lib', ENV['rvm_path']))
require "rvm/capistrano"
set :rvm_ruby_string, '1.9.2-p290'
set :rvm_type, :system
# /rvm

default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :application, "governor"
set :repository,  "git@github.com:brewster/governor.git"
set :scm, :git
set :user, ENV['BREWSTER_USER'] || ENV['USER']
set :branch, ENV['BRANCH'] || "master"
set :deploy_via, :remote_cache
set :use_sudo, true
set :admin_runner, "root"
set :keep_releases, 3
set :campfire_options, :account => 'brewster',
                       :room => 'the main room',
                       :token => 'e4152caa86149bec0ad5704c2dfaee752b19c83d',
                       :ssl => true
set :deploy_lockfile, "#{shared_path}/log/deploy_lockfile.txt"


task :production do
  set :rails_env, "production"
  server '50.57.78.86', :app, :db, :primary => true #dims01
  server '50.57.78.87', :app #dims02
  after "deploy:update", "deploy:restart_prod"
end

task :staging do
  set :rails_env, "staging"
  server '50.57.69.84', :app, :db, :primary => true #sfe01
  after "deploy:update", "deploy:restart_staging"
end

# Lock deploy, :migrations, :pre_migrations
%w(deploy deploy:migrations deploy:pre_migrations).each do |lock|
  before(lock.to_sym, 'deploy:lock'.to_sym)
end

# update symlinks after code is updated and fix perms; cleanup old releases
before "deploy", "deploy:fix_cached_copy_perms"
after "deploy:update_code", "deploy:fix_perms", "deploy:symlink_configs"
after "deploy:update", "deploy:cleanup"

## Spam campfire with our intentions
%w(deploy deploy:migrations deploy:pre_migrations).each do |hook|
  before(hook.to_sym, 'campfire:notify_before_deploy'.to_sym)
  after(hook.to_sym, 'campfire:notify_after_deploy'.to_sym)
end

namespace :campfire do
  desc "Deploy notice to Campfire"
  task :notify_before_deploy do
    local_user = ENV['USER'] || ENV['USERNAME']
    campfire_room.speak "#{local_user} is deploying to #{rails_env} with #{application}/#{branch}."
    campfire_room.play('crickets') if rails_env == 'production'
  end

  desc "Tell campfire that we're done deploying"
  task :notify_after_deploy do
    local_user = ENV['USER'] || ENV['USERNAME']
    campfire_room.speak "#{local_user} is finished deploying to #{rails_env} with #{application}/#{branch}."
    campfire_room.play('greatjob') if rails_env == 'production'
  end
end


## Start deploying
namespace :deploy do
  task :start do ; end
  task :stop do ; end

  ## Create deploy lockfiles
  task :lock, :roles => :app do
    check_lock
    logger.info "\e[0;31;1mATTENTION:\e[0m Creating deploy lockfile..."
    msg = fetch(:lock_message, 'Cap generated lock message')
    timestamp = Time.now.strftime("%m/%d/%Y %H:%M:%S %Z")
    lock_message = "Deploys locked by #{ENV['USER']} at #{timestamp}: #{msg}"
    put lock_message, "#{deploy_lockfile}", :mode => 0664
    run "chgrp eng #{deploy_lockfile}"
  end

  ## Check for lockfiles
  desc "Check if deploys are OK here or if someone has locked down deploys"
  task :check_lock, :roles => :app do
  run "cat #{deploy_lockfile};echo" do |ch, stream, data|
    if data =~ /Deploys locked by/
        logger.info "\e[0;31;1mABORTING:\e[0m #{data}"
        abort 'Deploys are locked on this machine'
      else
        logger.info "\e[0;31;1mNOTICE:\e[0m No lockfile found."
      end
    end
  end

  ## Remove lockfiles
  desc "Remove the deploy lock"
  task :unlock, :roles => :app do
    logger.info "\e[0;31;1mNOTICE:\e[0m Removing deploy lockfile..."
    run "rm -f #{deploy_lockfile}; echo"
  end

  desc "Restart app serially"
  task :restart_prod, :roles => :app do
    self.roles[:app].each do |host|
      logger.info "\e[0;31;1mNOTICE:\e[0m Restarting via => monit restart prod_nodejs_governor..."
      run "#{sudo :as => "root"} monit restart prod_nodejs_governor", :hosts => host
    end
  end
  after 'deploy:restart_prod', 'deploy:unlock'

  task :restart_staging, :roles => :app do
    self.roles[:app].each do |host|
      logger.info "\e[0;31;1mNOTICE:\e[0m Restarting via => monit restart staging_nodejs_governor..."
      run "#{sudo :as => "root"} monit restart staging_nodejs_governor", :hosts => host
    end
  end
  after 'deploy:restart_staging', 'deploy:unlock'

  task :symlink_configs, :except => { :no_release => true } do
    %w(config).each do |f|
      run "ln -svf #{shared_path}/config/#{f}.js #{release_path}/#{f}.js"
    end
  end

  task :fix_perms, :except => { :no_release => true } do
    logger.info "\e[0;31;1mNOTICE:\e[0m Changing group and perms on #{release_path}"
    run "#{sudo :as => "root"} chown -R deploy:eng #{release_path};echo"
  end

  task :fix_cached_copy_perms, :except => { :no_release => true } do
    logger.info "\e[0;31;1mNOTICE:\e[0m Changing group and perms on #{shared_path}/cached-copy/"
    run "#{sudo :as => "root"} rm -rf #{shared_path}/cached-copy; echo"
  end

end
