<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();   // sender
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 30);   // spam | abuse | misinformation | copyright | other
            $table->text('details')->nullable();
            $table->string('status', 20)->default('new');   // new | in_review | resolved | rejected
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
