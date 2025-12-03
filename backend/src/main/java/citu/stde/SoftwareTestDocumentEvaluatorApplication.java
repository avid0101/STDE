package citu.stde;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SoftwareTestDocumentEvaluatorApplication {

	public static void main(String[] args) {
		SpringApplication.run(SoftwareTestDocumentEvaluatorApplication.class, args);
		System.out.println("-----------------------------------");
		System.out.println("Backend started successfully");
		System.out.println("-----------------------------------");
	}
}