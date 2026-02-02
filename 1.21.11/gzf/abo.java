import io.netty.buffer.ByteBuf;
import java.util.Optional;
import java.util.UUID;

public record abo(UUID c, String d, String e, boolean f, Optional<yh> g) implements aay<abg> {
   public static final int a = 40;
   public static final aao<ByteBuf, abo> b;

   public abo(UUID param1, String param2, String param3, boolean param4, Optional<yh> param5) {
      if ($$2.length() > 40) {
         throw new IllegalArgumentException("Hash is too long (max 40, was " + $$2.length() + ")");
      } else {
         this.c = $$0;
         this.d = $$1;
         this.e = $$2;
         this.f = $$3;
         this.g = $$4;
      }
   }

   public aba<abo> a() {
      return abu.h;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public UUID b() {
      return this.c;
   }

   public String e() {
      return this.d;
   }

   public String f() {
      return this.e;
   }

   public boolean g() {
      return this.f;
   }

   public Optional<yh> h() {
      return this.g;
   }

   static {
      b = aao.a(jx.g, abo::b, aam.p, abo::e, aam.b(40), abo::f, aam.b, abo::g, yj.f.a(aam::a), abo::h, abo::new);
   }
}
