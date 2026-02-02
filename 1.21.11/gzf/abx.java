import io.netty.buffer.ByteBuf;
import java.util.Optional;

public record abx(amo b, Optional<vz> c) implements aay<abv> {
   private static final aao<ByteBuf, Optional<vz>> d = aam.a(() -> {
      return new vi(32768L, 16);
   }).a(aam.d(65536));
   public static final aao<ByteBuf, abx> a;

   public abx(amo param1, Optional<vz> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<abx> a() {
      return abu.s;
   }

   public void a(abv $$0) {
      $$0.a(this);
   }

   public amo b() {
      return this.b;
   }

   public Optional<vz> e() {
      return this.c;
   }

   static {
      a = aao.a(amo.b, abx::b, d, abx::e, abx::new);
   }
}
