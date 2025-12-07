package citu.stde.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoogleDriveService {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private static final String APPLICATION_NAME = "STDE Platform";
    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Helper to build the Drive client using the current user's OAuth token
     */
    private Drive getDriveClient() throws IOException {
        try {
            // 1. Get the current user's email (Principal Name)
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String principalName = authentication.getName(); 

            // 2. Load the OAuth2 client using the email
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient("google", principalName);

            if (client == null || client.getAccessToken() == null) {
                throw new IllegalStateException("Google Drive connection not found. Please logout and log in again with Google.");
            }

            // 3. Build the Drive Service
            String accessToken = client.getAccessToken().getTokenValue();
            GoogleCredentials credentials = GoogleCredentials.create(new AccessToken(accessToken, null));

            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

            return new Drive.Builder(HTTP_TRANSPORT, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                    .setApplicationName(APPLICATION_NAME)
                    .build();

        } catch (Exception e) {
            throw new IOException("Failed to create Google Drive client: " + e.getMessage(), e);
        }
    }

    /**
     * Uploads a file to Google Drive.
     * @param multipartFile The file from the frontend
     * @param folderId Optional: The ID of the folder to upload to (can be null for root)
     * @return The Drive File object (containing ID, WebViewLink, etc.)
     */
    public File uploadFile(MultipartFile multipartFile, String folderId) throws IOException {
        Drive driveService = getDriveClient();

        // 1. Set file metadata
        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());
        
        // If a folder ID is provided, place the file inside it
        if (folderId != null && !folderId.isEmpty()) {
            fileMetadata.setParents(Collections.singletonList(folderId));
        }

        // 2. Set file content
        InputStreamContent mediaContent = new InputStreamContent(
                multipartFile.getContentType(),
                multipartFile.getInputStream()
        );

        // 3. Upload
        // We request 'id' and 'webViewLink' fields in the response
        return driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, name, webViewLink, size, mimeType")
                .execute();
    }

    /**
     * Creates a new folder in Google Drive.
     * Used when a Teacher creates a new Class.
     */
    public String createFolder(String folderName, String parentFolderId) throws IOException {
        Drive driveService = getDriveClient();

        File fileMetadata = new File();
        fileMetadata.setName(folderName);
        fileMetadata.setMimeType("application/vnd.google-apps.folder");

        if (parentFolderId != null) {
            fileMetadata.setParents(Collections.singletonList(parentFolderId));
        }

        File file = driveService.files().create(fileMetadata)
                .setFields("id")
                .execute();

        return file.getId();
    }

    /**
     * Downloads a file's content as an InputStream.
     * Used by the AI Evaluation Service to read the file text.
     */
    public InputStream downloadFile(String fileId) throws IOException {
        Drive driveService = getDriveClient();
        
        // For Google Docs/Slides (native formats), we might need export(), 
        // but for uploaded PDFs/DOCX, we use get().executeMedia()
        return driveService.files().get(fileId).executeMediaAsInputStream();
    }

    /**
     * Deletes a file from Google Drive (moves to trash).
     */
    public void deleteFile(String fileId) throws IOException {
        Drive driveService = getDriveClient();
        driveService.files().delete(fileId).execute();
    }
}