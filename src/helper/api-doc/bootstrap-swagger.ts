import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { DEMO_API_TAG } from '../../demo';

function filterOutTag(doc: OpenAPIObject, tagToRemove: string, schemaPrefix?: string): OpenAPIObject {
	const filtered = structuredClone(doc);

	for (const [path, pathItem] of Object.entries(filtered.paths)) {
		for (const method of Object.keys(pathItem)) {
			const operation = pathItem[method as keyof typeof pathItem] as OperationObject | undefined;
			if (operation?.tags?.includes(tagToRemove)) {
				delete pathItem[method as keyof typeof pathItem];
			}
		}
		if (Object.keys(pathItem).length === 0) {
			delete filtered.paths[path];
		}
	}

	filtered.tags = filtered.tags?.filter((t) => t.name !== tagToRemove);

	if (schemaPrefix && filtered.components?.schemas) {
		for (const schemaName of Object.keys(filtered.components.schemas)) {
			if (schemaName.startsWith(schemaPrefix)) {
				delete filtered.components.schemas[schemaName];
			}
		}
	}

	return filtered;
}

export function bootstrapSwagger(app: INestApplication): void {
	const configService = app.get(ConfigService);
	const enableApiDoc = configService.get<string>('ENABLE_API_DOC', 'true') === 'true';

	if (!enableApiDoc) {
		return;
	}

	const enableSwaggerDemo = configService.get<string>('ENABLE_SWAGGER_DEMO', 'true') === 'true';
	const version = configService.get<string>('APP_API_VERSION', 'dev');

	const config = new DocumentBuilder()
		.setTitle('Lottery Backend API')
		.setDescription('Year-end Party Lottery System API')
		.setVersion(version)
		.build();

	let document = SwaggerModule.createDocument(app, config);

	if (!enableSwaggerDemo) {
		document = filterOutTag(document, DEMO_API_TAG, 'Demo');
	}

	SwaggerModule.setup('api/doc', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});
}
