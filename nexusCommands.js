#!/bin/bash

# Update system and install dependencies
echo "Updating system and installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install openjdk-17-jdk wget -y

# Install Nexus Repository
echo "Downloading Nexus Repository Manager..."
cd /opt
sudo wget https://download.sonatype.com/nexus/3/latest-unix.tar.gz

echo "Extracting Nexus..."
sudo tar -xvzf latest-unix.tar.gz

echo "Renaming Nexus folder..."
sudo mv /opt/nexus-* /opt/nexus

# Create a new user for Nexus
echo "Creating a new user for Nexus..."
sudo adduser nexus

# Set no password for Nexus user in sudoers file
echo "Setting up Nexus user in sudoers..."
sudo visudo <<EOF
nexus ALL=(ALL) NOPASSWD: ALL
EOF

# Change ownership of Nexus files to the Nexus user
echo "Changing ownership of Nexus files..."
sudo chown -R nexus:nexus /opt/nexus
sudo chown -R nexus:nexus /opt/sonatype-work

# Modify Nexus to run as the nexus user
echo "Configuring Nexus to run as user 'nexus'..."
sudo sed -i 's/#run_as_user="nexus"/run_as_user="nexus"/' /opt/nexus/bin/nexus.rc

# Increase JVM heap size if necessary
echo "Configuring JVM options..."
sudo sed -i 's/XX:MaxDirectMemorySize.*/-XX:MaxDirectMemorySize=2703m/' /opt/nexus/bin/nexus.vmoptions

# Wait for a few moments before continuing
echo "Please wait for a few moments..."
sleep 5  # Pause for 5 seconds

# Create systemd service for Nexus
echo "Setting up Nexus as a service..."
echo "[Unit]
Description=nexus service
After=network.target

[Service]
Type=forking
LimitNOFILE=65536
ExecStart=/opt/nexus/bin/nexus start
ExecStop=/opt/nexus/bin/nexus stop
User=nexus
Restart=on-abort

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/nexus.service

# Start and enable Nexus service
echo "Starting Nexus service..."
sudo systemctl start nexus
sudo systemctl enable nexus

# Open the firewall port for Nexus web interface
echo "Opening firewall port 8081 for Nexus web interface..."
sudo ufw allow 8081/tcp

# Display completion message
echo "Nexus Repository Manager is installed and running."
echo "You can access the web interface at: http://<your-server-ip>:8081"

sleep 5

# Check Nexus service status
sudo systemctl status nexus