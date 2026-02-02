import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

public record alq(yh b, Optional<alq.b> c, Optional<alq.c> d, Optional<alq.a> e, boolean f) {
   public static final Codec<alq> a = RecordCodecBuilder.create(($$0) -> {
      return $$0.group(yj.a.lenientOptionalFieldOf("description", yg.a).forGetter(alq::a), alq.b.a.lenientOptionalFieldOf("players").forGetter(alq::b), alq.c.a.lenientOptionalFieldOf("version").forGetter(alq::c), alq.a.a.lenientOptionalFieldOf("favicon").forGetter(alq::d), Codec.BOOL.lenientOptionalFieldOf("enforcesSecureChat", false).forGetter(alq::e)).apply($$0, alq::new);
   });

   public alq(yh param1, Optional<alq.b> param2, Optional<alq.c> param3, Optional<alq.a> param4, boolean param5) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   public yh a() {
      return this.b;
   }

   public Optional<alq.b> b() {
      return this.c;
   }

   public Optional<alq.c> c() {
      return this.d;
   }

   public Optional<alq.a> d() {
      return this.e;
   }

   public boolean e() {
      return this.f;
   }

   public static record b(int b, int c, List<bbx> d) {
      public static final Codec<alq.b> a = RecordCodecBuilder.create(($$0) -> {
         return $$0.group(Codec.INT.fieldOf("max").forGetter(alq.b::a), Codec.INT.fieldOf("online").forGetter(alq.b::b), bbx.a.listOf().lenientOptionalFieldOf("sample", List.of()).forGetter(alq.b::c)).apply($$0, alq.b::new);
      });

      public b(int param1, int param2, List<bbx> param3) {
         this.b = $$0;
         this.c = $$1;
         this.d = $$2;
      }

      public int a() {
         return this.b;
      }

      public int b() {
         return this.c;
      }

      public List<bbx> c() {
         return this.d;
      }
   }

   public static record c(String b, int c) {
      public static final Codec<alq.c> a = RecordCodecBuilder.create(($$0) -> {
         return $$0.group(Codec.STRING.fieldOf("name").forGetter(alq.c::b), Codec.INT.fieldOf("protocol").forGetter(alq.c::c)).apply($$0, alq.c::new);
      });

      public c(String param1, int param2) {
         this.b = $$0;
         this.c = $$1;
      }

      public static alq.c a() {
         aa $$0 = w.b();
         return new alq.c($$0.c(), $$0.d());
      }

      public String b() {
         return this.b;
      }

      public int c() {
         return this.c;
      }
   }

   public static record a(byte[] b) {
      private static final String c = "data:image/png;base64,";
      public static final Codec<alq.a> a;

      public a(byte[] param1) {
         this.b = $$0;
      }

      public byte[] a() {
         return this.b;
      }

      static {
         a = Codec.STRING.comapFlatMap(($$0) -> {
            if (!$$0.startsWith("data:image/png;base64,")) {
               return DataResult.error(() -> {
                  return "Unknown format";
               });
            } else {
               try {
                  String $$1 = $$0.substring("data:image/png;base64,".length()).replaceAll("\n", "");
                  byte[] $$2 = Base64.getDecoder().decode($$1.getBytes(StandardCharsets.UTF_8));
                  return DataResult.success(new alq.a($$2));
               } catch (IllegalArgumentException var3) {
                  return DataResult.error(() -> {
                     return "Malformed base64 server icon";
                  });
               }
            }
         }, ($$0) -> {
            String var10000 = new String(Base64.getEncoder().encode($$0.b), StandardCharsets.UTF_8);
            return "data:image/png;base64," + var10000;
         });
      }
   }
}
