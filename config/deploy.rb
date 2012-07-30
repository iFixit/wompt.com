load 'deploy' if respond_to?(:namespace) # cap2 differentiator

set :application, "wompt"

set :scm, :git
set :repository, "git@github.com:Wompt/wompt.com.git"
set :git_enable_submodules, true
set :deploy_via, :remote_cache

set :use_sudo, true
set :normalize_asset_timestamps, false
set :copy_exclude, [".git"]
set :monit_config_location, "/etc/monit/"

# Node settings
set :node_path, "/usr/bin/node"

default_run_options[:pty] = true

# Use a login shell when executing commands so that
# .bashrc and .bash_profile are loaded.
set :default_shell, "sh -l"


task :production do
  # :deployment variable should match task name
  set :deployment, 'production'
  set :deploy_to, "/home/ubuntu/www/#{application}"
  set :branch, "master"
  # environment string that is passed to the nodejs and auth apps at startup
  set :application_environment, 'production'
  find_and_execute_task("deploy:tags:schedule_creation")
end

if File.exists?("wompt.conf")
   load 'wompt.conf'
else
   $stderr.puts "No deployment configuration file found. Copy wompt.conf.example to wompt.conf"
end

load 'config/tasks'
load 'config/config_files'
load 'config/deploy_tags'
load 'config/symlinks'
load 'config/npm'
load 'config/gems'
