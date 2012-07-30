namespace :deploy do
  desc "Start both servers [nodejs, auth]"
  task :start, :roles => :app, :except => { :no_release => true } do
    apps.each do |app_name|
      run "#{try_sudo :as => 'root'} /sbin/service #{app_name} start"
    end
  end

  desc "Stop both servers [nodejs, auth]"
  task :stop, :roles => :app, :except => { :no_release => true } do
    apps.each do |app_name|
      run "#{try_sudo :as => 'root'} /sbin/service #{app_name} stop"
    end
  end

  desc "Restart both servers [nodejs, auth]"
  task :restart, :roles => :app, :except => { :no_release => true } do
    apps.each do |app_name|
      run "#{try_sudo :as => 'root'} /sbin/service #{app_name} restart"
    end
  end
  
  def apps
    ["#{env_prefix}wompt_auth", "#{env_prefix}wompt"]
  end
  
  def env_prefix
    prefix = deployment == 'production' ? '' : (deployment + '_')
  end

  desc "Update git submodules for the cached copy (Cpaistrano 2.5.20 will do this automatically)"
  task "update_submodules_recursive" do
    run "cd #{shared_path}/cached-copy && git submodule update --init --recursive"
  end
  
  ## Disable some default tasks that don't apply to a NodeJS app
  task :migrate do
    puts "    not doing migrate because not a Rails application."
  end
  task :finalize_update do
    puts "    not doing finalize_update because not a Rails application."
  end
end
